#pragma once

#include <vector>
#include <unordered_map>
#include <string>
#include "core/Graph.h"

namespace algonet {

struct DijkstraResult {
    std::vector<int> path;
    double totalCost;
    std::unordered_map<int, double> distances;
    std::unordered_map<int, int> previous;
    bool reachable;

    std::string toJSON() const;
};

class Dijkstra {
public:
    static DijkstraResult findShortestPath(const Graph& graph, int source, int destination);
    static std::unordered_map<int, double> computeDistanceTable(const Graph& graph, int source);
};

} // namespace algonet
