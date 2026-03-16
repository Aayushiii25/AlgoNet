#pragma once

#include <string>
#include <vector>
#include <sstream>
#include <chrono>

namespace algonet {

enum class PacketStatus {
    PENDING,
    IN_TRANSIT,
    DELIVERED,
    DROPPED
};

struct Packet {
    int id;
    int source;
    int destination;
    std::string payload;
    std::vector<int> path;
    PacketStatus status;
    double latency;  // in ms
    int hops;
    long long timestamp;

    Packet() : id(-1), source(-1), destination(-1), status(PacketStatus::PENDING),
               latency(0), hops(0), timestamp(0) {}

    Packet(int id, int src, int dest, const std::string& payload)
        : id(id), source(src), destination(dest), payload(payload),
          status(PacketStatus::PENDING), latency(0), hops(0) {
        auto now = std::chrono::system_clock::now();
        timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()).count();
    }

    std::string statusToString() const {
        switch (status) {
            case PacketStatus::PENDING: return "pending";
            case PacketStatus::IN_TRANSIT: return "in_transit";
            case PacketStatus::DELIVERED: return "delivered";
            case PacketStatus::DROPPED: return "dropped";
            default: return "unknown";
        }
    }

    std::string toJSON() const {
        std::ostringstream oss;
        oss << "{"
            << "\"id\":" << id << ","
            << "\"source\":" << source << ","
            << "\"destination\":" << destination << ","
            << "\"payload\":\"" << payload << "\","
            << "\"status\":\"" << statusToString() << "\","
            << "\"latency\":" << latency << ","
            << "\"hops\":" << hops << ","
            << "\"timestamp\":" << timestamp << ","
            << "\"path\":[";
        for (size_t i = 0; i < path.size(); ++i) {
            oss << path[i];
            if (i < path.size() - 1) oss << ",";
        }
        oss << "]}";
        return oss.str();
    }
};

} // namespace algonet
