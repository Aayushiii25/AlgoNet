#include "simulator/NetworkSimulator.h"
#include <cmath>
#include <sstream>
#include <algorithm>

namespace algonet {

std::string SimulationStats::toJSON() const {
    std::ostringstream oss;
    oss << "{"
        << "\"totalPacketsSent\":" << totalPacketsSent << ","
        << "\"packetsDelivered\":" << packetsDelivered << ","
        << "\"packetsDropped\":" << packetsDropped << ","
        << "\"averageLatency\":" << averageLatency << ","
        << "\"averageHops\":" << averageHops << ","
        << "\"totalRouters\":" << totalRouters << ","
        << "\"totalLinks\":" << totalLinks << ","
        << "\"deliveryRate\":"
        << (totalPacketsSent > 0 ? (100.0 * packetsDelivered / totalPacketsSent) : 0.0)
        << "}";
    return oss.str();
}

NetworkSimulator::NetworkSimulator()
    : rng_(std::random_device{}()) {
    loadPreset("mesh");
}

void NetworkSimulator::loadPreset(const std::string& preset) {
    clear();
    if (preset == "mesh") createMeshTopology();
    else if (preset == "ring") createRingTopology();
    else if (preset == "star") createStarTopology();
    else if (preset == "tree") createTreeTopology();
    else if (preset == "random") createRandomTopology();
    else createMeshTopology();
}

void NetworkSimulator::addRouter(const std::string& name, double x, double y) {
    Router r(nextRouterId_++, name, x, y);
    graph_.addRouter(r);
}

void NetworkSimulator::addLink(int from, int to, double weight, double bandwidth) {
    graph_.addLink(from, to, weight, bandwidth);
}

void NetworkSimulator::removeRouter(int id) {
    graph_.removeRouter(id);
}

void NetworkSimulator::removeLink(int from, int to) {
    graph_.removeLink(from, to);
}

void NetworkSimulator::toggleRouter(int id) {
    if (graph_.hasRouter(id)) {
        bool current = graph_.getRouter(id).active;
        graph_.setRouterStatus(id, !current);
    }
}

void NetworkSimulator::clear() {
    graph_.clear();
    packetLog_.clear();
    nextRouterId_ = 0;
    nextPacketId_ = 0;
}

DijkstraResult NetworkSimulator::findRoute(int source, int destination) {
    return Dijkstra::findShortestPath(graph_, source, destination);
}

Packet NetworkSimulator::simulatePacket(int source, int destination, const std::string& payload) {
    Packet pkt(nextPacketId_++, source, destination, payload);

    auto result = Dijkstra::findShortestPath(graph_, source, destination);

    if (result.reachable) {
        pkt.path = result.path;
        pkt.hops = static_cast<int>(result.path.size()) - 1;
        pkt.latency = result.totalCost;
        pkt.status = PacketStatus::DELIVERED;
    } else {
        pkt.status = PacketStatus::DROPPED;
        pkt.latency = 0;
        pkt.hops = 0;
    }

    packetLog_.push_back(pkt);
    return pkt;
}

SimulationStats NetworkSimulator::getStats() const {
    SimulationStats stats;
    stats.totalPacketsSent = static_cast<int>(packetLog_.size());
    stats.totalRouters = graph_.getRouterCount();
    stats.totalLinks = graph_.getLinkCount();

    double totalLatency = 0;
    double totalHops = 0;

    for (const auto& pkt : packetLog_) {
        if (pkt.status == PacketStatus::DELIVERED) {
            stats.packetsDelivered++;
            totalLatency += pkt.latency;
            totalHops += pkt.hops;
        } else if (pkt.status == PacketStatus::DROPPED) {
            stats.packetsDropped++;
        }
    }

    if (stats.packetsDelivered > 0) {
        stats.averageLatency = totalLatency / stats.packetsDelivered;
        stats.averageHops = totalHops / stats.packetsDelivered;
    }

    return stats;
}

std::string NetworkSimulator::getTopologyJSON() const {
    return graph_.toJSON();
}

std::string NetworkSimulator::getPacketLogJSON() const {
    std::ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < packetLog_.size(); ++i) {
        oss << packetLog_[i].toJSON();
        if (i < packetLog_.size() - 1) oss << ",";
    }
    oss << "]";
    return oss.str();
}

// ========== Preset Topologies ==========

void NetworkSimulator::createMeshTopology() {
    // 6-node partial mesh
    double cx = 400, cy = 300, r = 200;
    std::vector<std::string> names = {"Router-A", "Router-B", "Router-C", "Router-D", "Router-E", "Router-F"};
    for (int i = 0; i < 6; ++i) {
        double angle = 2.0 * M_PI * i / 6.0 - M_PI / 2.0;
        double x = cx + r * cos(angle);
        double y = cy + r * sin(angle);
        addRouter(names[i], x, y);
    }
    addLink(0, 1, 2.0);
    addLink(0, 2, 4.0);
    addLink(0, 5, 7.0);
    addLink(1, 2, 1.0);
    addLink(1, 3, 5.0);
    addLink(2, 3, 3.0);
    addLink(2, 4, 6.0);
    addLink(3, 4, 2.0);
    addLink(3, 5, 4.0);
    addLink(4, 5, 3.0);
}

void NetworkSimulator::createRingTopology() {
    double cx = 400, cy = 300, r = 200;
    int n = 8;
    for (int i = 0; i < n; ++i) {
        double angle = 2.0 * M_PI * i / n - M_PI / 2.0;
        double x = cx + r * cos(angle);
        double y = cy + r * sin(angle);
        addRouter("Node-" + std::to_string(i), x, y);
    }
    for (int i = 0; i < n; ++i) {
        double w = 1.0 + (rng_() % 5);
        addLink(i, (i + 1) % n, w);
    }
}

void NetworkSimulator::createStarTopology() {
    addRouter("Hub", 400, 300);
    double r = 220;
    int n = 7;
    for (int i = 0; i < n; ++i) {
        double angle = 2.0 * M_PI * i / n - M_PI / 2.0;
        double x = 400 + r * cos(angle);
        double y = 300 + r * sin(angle);
        addRouter("Leaf-" + std::to_string(i), x, y);
        addLink(0, i + 1, 2.0 + (rng_() % 4));
    }
}

void NetworkSimulator::createTreeTopology() {
    // Binary tree with 7 nodes
    addRouter("Root", 400, 80);
    addRouter("L1-A", 250, 200);
    addRouter("L1-B", 550, 200);
    addRouter("L2-A", 150, 350);
    addRouter("L2-B", 350, 350);
    addRouter("L2-C", 450, 350);
    addRouter("L2-D", 650, 350);

    addLink(0, 1, 3.0);
    addLink(0, 2, 4.0);
    addLink(1, 3, 2.0);
    addLink(1, 4, 5.0);
    addLink(2, 5, 3.0);
    addLink(2, 6, 2.0);
}

void NetworkSimulator::createRandomTopology() {
    int n = 8 + (rng_() % 5);
    for (int i = 0; i < n; ++i) {
        double x = 100 + (rng_() % 600);
        double y = 80 + (rng_() % 440);
        addRouter("R" + std::to_string(i), x, y);
    }
    // Ensure connectivity with a spanning tree first
    for (int i = 1; i < n; ++i) {
        int parent = rng_() % i;
        double w = 1.0 + (rng_() % 8);
        addLink(parent, i, w);
    }
    // Add extra random edges
    int extraEdges = n / 2 + (rng_() % n);
    for (int i = 0; i < extraEdges; ++i) {
        int a = rng_() % n;
        int b = rng_() % n;
        if (a != b && !graph_.hasLink(a, b)) {
            double w = 1.0 + (rng_() % 10);
            addLink(a, b, w);
        }
    }
}

} // namespace algonet
