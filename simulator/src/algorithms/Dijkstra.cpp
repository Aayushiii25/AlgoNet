#include "algorithms/Dijkstra.h"
#include <queue>
#include <limits>
#include <algorithm>
#include <sstream>

namespace algonet {

std::string DijkstraResult::toJSON() const {
    std::ostringstream oss;
    oss << "{"
        << "\"reachable\":" << (reachable ? "true" : "false") << ","
        << "\"totalCost\":" << totalCost << ","
        << "\"path\":[";
    for (size_t i = 0; i < path.size(); ++i) {
        oss << path[i];
        if (i < path.size() - 1) oss << ",";
    }
    oss << "],\"distances\":{";
    bool first = true;
    for (const auto& [node, dist] : distances) {
        if (!first) oss << ",";
        oss << "\"" << node << "\":" << dist;
        first = false;
    }
    oss << "},\"previous\":{";
    first = true;
    for (const auto& [node, prev] : previous) {
        if (!first) oss << ",";
        oss << "\"" << node << "\":" << prev;
        first = false;
    }
    oss << "}}";
    return oss.str();
}

DijkstraResult Dijkstra::findShortestPath(const Graph& graph, int source, int destination) {
    DijkstraResult result;
    result.reachable = false;
    result.totalCost = std::numeric_limits<double>::infinity();

    auto routerIds = graph.getRouterIds();
    if (routerIds.empty()) return result;

    // Initialize distances
    std::unordered_map<int, double> dist;
    std::unordered_map<int, int> prev;
    std::unordered_map<int, bool> visited;

    for (int id : routerIds) {
        dist[id] = std::numeric_limits<double>::infinity();
        prev[id] = -1;
        visited[id] = false;
    }
    dist[source] = 0.0;

    // Min-heap: (distance, node_id)
    using PQElement = std::pair<double, int>;
    std::priority_queue<PQElement, std::vector<PQElement>, std::greater<PQElement>> pq;
    pq.push({0.0, source});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (visited[u]) continue;
        visited[u] = true;

        // Skip inactive routers (except source and destination)
        if (u != source && u != destination && !graph.getRouter(u).active) {
            continue;
        }

        if (u == destination) {
            result.reachable = true;
            result.totalCost = d;
            break;
        }

        for (const auto& [neighbor, weight] : graph.getNeighbors(u)) {
            if (visited[neighbor]) continue;
            if (!graph.getRouter(neighbor).active && neighbor != destination) continue;

            double newDist = d + weight;
            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                prev[neighbor] = u;
                pq.push({newDist, neighbor});
            }
        }
    }

    // Reconstruct path
    if (result.reachable) {
        std::vector<int> path;
        int current = destination;
        while (current != -1) {
            path.push_back(current);
            current = prev[current];
        }
        std::reverse(path.begin(), path.end());
        result.path = path;
    }

    result.distances = dist;
    result.previous = prev;

    return result;
}

std::unordered_map<int, double> Dijkstra::computeDistanceTable(const Graph& graph, int source) {
    auto routerIds = graph.getRouterIds();
    std::unordered_map<int, double> dist;
    std::unordered_map<int, bool> visited;

    for (int id : routerIds) {
        dist[id] = std::numeric_limits<double>::infinity();
        visited[id] = false;
    }
    dist[source] = 0.0;

    using PQElement = std::pair<double, int>;
    std::priority_queue<PQElement, std::vector<PQElement>, std::greater<PQElement>> pq;
    pq.push({0.0, source});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (visited[u]) continue;
        visited[u] = true;

        if (!graph.getRouter(u).active && u != source) continue;

        for (const auto& [neighbor, weight] : graph.getNeighbors(u)) {
            if (visited[neighbor]) continue;
            if (!graph.getRouter(neighbor).active) continue;

            double newDist = d + weight;
            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.push({newDist, neighbor});
            }
        }
    }

    return dist;
}

} // namespace algonet
