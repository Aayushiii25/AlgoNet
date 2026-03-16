#pragma once

#include <vector>
#include <unordered_map>
#include <string>
#include "Router.h"

namespace algonet {

struct Link {
    int from;
    int to;
    double weight;  // latency in ms
    double bandwidth; // Mbps

    Link() : from(-1), to(-1), weight(1.0), bandwidth(100.0) {}
    Link(int from, int to, double weight, double bandwidth = 100.0)
        : from(from), to(to), weight(weight), bandwidth(bandwidth) {}

    std::string toJSON() const {
        std::ostringstream oss;
        oss << "{"
            << "\"from\":" << from << ","
            << "\"to\":" << to << ","
            << "\"weight\":" << weight << ","
            << "\"bandwidth\":" << bandwidth
            << "}";
        return oss.str();
    }
};

class Graph {
public:
    Graph() = default;

    void addRouter(const Router& router);
    void removeRouter(int id);
    void addLink(int from, int to, double weight, double bandwidth = 100.0);
    void removeLink(int from, int to);
    void setRouterStatus(int id, bool active);

    const Router& getRouter(int id) const;
    std::vector<int> getRouterIds() const;
    std::vector<std::pair<int, double>> getNeighbors(int id) const;
    std::vector<Link> getLinks() const;
    bool hasRouter(int id) const;
    bool hasLink(int from, int to) const;
    int getRouterCount() const;
    int getLinkCount() const;

    void clear();
    std::string toJSON() const;

private:
    std::unordered_map<int, Router> routers_;
    // adjacency list: router_id -> [(neighbor_id, weight)]
    std::unordered_map<int, std::vector<std::pair<int, double>>> adjacency_;
    std::vector<Link> links_;
};

} // namespace algonet
