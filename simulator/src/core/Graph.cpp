#include "core/Graph.h"
#include <algorithm>
#include <stdexcept>
#include <sstream>

namespace algonet {

void Graph::addRouter(const Router& router) {
    routers_[router.id] = router;
    if (adjacency_.find(router.id) == adjacency_.end()) {
        adjacency_[router.id] = {};
    }
}

void Graph::removeRouter(int id) {
    routers_.erase(id);
    adjacency_.erase(id);
    // Remove all links to this router
    for (auto& [key, neighbors] : adjacency_) {
        neighbors.erase(
            std::remove_if(neighbors.begin(), neighbors.end(),
                [id](const std::pair<int, double>& p) { return p.first == id; }),
            neighbors.end()
        );
    }
    links_.erase(
        std::remove_if(links_.begin(), links_.end(),
            [id](const Link& l) { return l.from == id || l.to == id; }),
        links_.end()
    );
}

void Graph::addLink(int from, int to, double weight, double bandwidth) {
    if (!hasRouter(from) || !hasRouter(to)) {
        throw std::runtime_error("Router not found");
    }

    // Remove existing link if any
    removeLink(from, to);

    adjacency_[from].emplace_back(to, weight);
    adjacency_[to].emplace_back(from, weight);  // Undirected graph
    links_.emplace_back(from, to, weight, bandwidth);
}

void Graph::removeLink(int from, int to) {
    auto& fromNeighbors = adjacency_[from];
    fromNeighbors.erase(
        std::remove_if(fromNeighbors.begin(), fromNeighbors.end(),
            [to](const std::pair<int, double>& p) { return p.first == to; }),
        fromNeighbors.end()
    );

    auto& toNeighbors = adjacency_[to];
    toNeighbors.erase(
        std::remove_if(toNeighbors.begin(), toNeighbors.end(),
            [from](const std::pair<int, double>& p) { return p.first == from; }),
        toNeighbors.end()
    );

    links_.erase(
        std::remove_if(links_.begin(), links_.end(),
            [from, to](const Link& l) {
                return (l.from == from && l.to == to) || (l.from == to && l.to == from);
            }),
        links_.end()
    );
}

void Graph::setRouterStatus(int id, bool active) {
    if (routers_.find(id) != routers_.end()) {
        routers_[id].active = active;
    }
}

const Router& Graph::getRouter(int id) const {
    return routers_.at(id);
}

std::vector<int> Graph::getRouterIds() const {
    std::vector<int> ids;
    ids.reserve(routers_.size());
    for (const auto& [id, router] : routers_) {
        ids.push_back(id);
    }
    std::sort(ids.begin(), ids.end());
    return ids;
}

std::vector<std::pair<int, double>> Graph::getNeighbors(int id) const {
    auto it = adjacency_.find(id);
    if (it != adjacency_.end()) {
        return it->second;
    }
    return {};
}

std::vector<Link> Graph::getLinks() const {
    return links_;
}

bool Graph::hasRouter(int id) const {
    return routers_.find(id) != routers_.end();
}

bool Graph::hasLink(int from, int to) const {
    for (const auto& link : links_) {
        if ((link.from == from && link.to == to) || (link.from == to && link.to == from)) {
            return true;
        }
    }
    return false;
}

int Graph::getRouterCount() const {
    return static_cast<int>(routers_.size());
}

int Graph::getLinkCount() const {
    return static_cast<int>(links_.size());
}

void Graph::clear() {
    routers_.clear();
    adjacency_.clear();
    links_.clear();
}

std::string Graph::toJSON() const {
    std::ostringstream oss;
    oss << "{\"routers\":[";
    auto ids = getRouterIds();
    for (size_t i = 0; i < ids.size(); ++i) {
        oss << routers_.at(ids[i]).toJSON();
        if (i < ids.size() - 1) oss << ",";
    }
    oss << "],\"links\":[";
    for (size_t i = 0; i < links_.size(); ++i) {
        oss << links_[i].toJSON();
        if (i < links_.size() - 1) oss << ",";
    }
    oss << "]}";
    return oss.str();
}

} // namespace algonet
