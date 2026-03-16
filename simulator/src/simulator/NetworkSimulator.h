#pragma once

#include "core/Graph.h"
#include "core/Packet.h"
#include "algorithms/Dijkstra.h"
#include <vector>
#include <string>
#include <random>

namespace algonet {

struct SimulationStats {
    int totalPacketsSent = 0;
    int packetsDelivered = 0;
    int packetsDropped = 0;
    double averageLatency = 0.0;
    double averageHops = 0.0;
    int totalRouters = 0;
    int totalLinks = 0;

    std::string toJSON() const;
};

class NetworkSimulator {
public:
    NetworkSimulator();

    // Topology management
    void loadPreset(const std::string& preset);
    void addRouter(const std::string& name, double x, double y);
    void addLink(int from, int to, double weight, double bandwidth = 100.0);
    void removeRouter(int id);
    void removeLink(int from, int to);
    void toggleRouter(int id);
    void clear();

    // Simulation
    DijkstraResult findRoute(int source, int destination);
    Packet simulatePacket(int source, int destination, const std::string& payload);

    // Getters
    const Graph& getGraph() const { return graph_; }
    const std::vector<Packet>& getPacketLog() const { return packetLog_; }
    SimulationStats getStats() const;
    std::string getTopologyJSON() const;
    std::string getPacketLogJSON() const;

private:
    Graph graph_;
    std::vector<Packet> packetLog_;
    int nextRouterId_ = 0;
    int nextPacketId_ = 0;
    std::mt19937 rng_;

    void createMeshTopology();
    void createRingTopology();
    void createStarTopology();
    void createTreeTopology();
    void createRandomTopology();
};

} // namespace algonet
