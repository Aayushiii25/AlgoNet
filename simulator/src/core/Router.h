#pragma once

#include <string>
#include <sstream>

namespace algonet {

struct Router {
    int id;
    std::string name;
    double x;  // X coordinate for UI positioning
    double y;  // Y coordinate for UI positioning
    bool active;

    Router() : id(-1), name(""), x(0), y(0), active(true) {}

    Router(int id, const std::string& name, double x, double y)
        : id(id), name(name), x(x), y(y), active(true) {}

    std::string toJSON() const {
        std::ostringstream oss;
        oss << "{"
            << "\"id\":" << id << ","
            << "\"name\":\"" << name << "\","
            << "\"x\":" << x << ","
            << "\"y\":" << y << ","
            << "\"active\":" << (active ? "true" : "false")
            << "}";
        return oss.str();
    }
};

} // namespace algonet
