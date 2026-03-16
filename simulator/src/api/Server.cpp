#include "simulator/NetworkSimulator.h"
#include "httplib.h"
#include <iostream>
#include <string>
#include <sstream>

namespace algonet {

// Simple JSON value extractor helpers
static std::string extractString(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(':', pos);
    if (pos == std::string::npos) return "";
    auto start = json.find('"', pos + 1);
    if (start == std::string::npos) return "";
    auto end = json.find('"', start + 1);
    if (end == std::string::npos) return "";
    return json.substr(start + 1, end - start - 1);
}

static double extractNumber(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    auto pos = json.find(search);
    if (pos == std::string::npos) return 0;
    pos = json.find(':', pos);
    if (pos == std::string::npos) return 0;
    pos++;
    while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    std::string numStr;
    while (pos < json.size() && (isdigit(json[pos]) || json[pos] == '.' || json[pos] == '-')) {
        numStr += json[pos++];
    }
    return numStr.empty() ? 0 : std::stod(numStr);
}

static int extractInt(const std::string& json, const std::string& key) {
    return static_cast<int>(extractNumber(json, key));
}

void startServer(int port) {
    httplib::Server svr;
    NetworkSimulator simulator;

    // CORS middleware
    svr.set_pre_routing_handler([](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        return httplib::Server::HandlerResponse::Unhandled;
    });

    // Handle OPTIONS preflight
    svr.Options(".*", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 204;
    });

    // GET /api/topology - Get current network topology
    svr.Get("/api/topology", [&](const httplib::Request&, httplib::Response& res) {
        res.set_content(simulator.getTopologyJSON(), "application/json");
    });

    // POST /api/topology/preset - Load a preset topology
    svr.Post("/api/topology/preset", [&](const httplib::Request& req, httplib::Response& res) {
        std::string preset = extractString(req.body, "preset");
        if (preset.empty()) preset = "mesh";
        simulator.loadPreset(preset);
        res.set_content(simulator.getTopologyJSON(), "application/json");
    });

    // POST /api/topology/clear - Clear topology
    svr.Post("/api/topology/clear", [&](const httplib::Request&, httplib::Response& res) {
        simulator.clear();
        res.set_content("{\"status\":\"cleared\"}", "application/json");
    });

    // POST /api/router - Add a router
    svr.Post("/api/router", [&](const httplib::Request& req, httplib::Response& res) {
        std::string name = extractString(req.body, "name");
        double x = extractNumber(req.body, "x");
        double y = extractNumber(req.body, "y");
        if (name.empty()) name = "Router-" + std::to_string(simulator.getGraph().getRouterCount());
        simulator.addRouter(name, x, y);
        res.set_content(simulator.getTopologyJSON(), "application/json");
    });

    // POST /api/router/toggle - Toggle router active/inactive
    svr.Post("/api/router/toggle", [&](const httplib::Request& req, httplib::Response& res) {
        int id = extractInt(req.body, "id");
        simulator.toggleRouter(id);
        res.set_content(simulator.getTopologyJSON(), "application/json");
    });

    // POST /api/link - Add a link between routers
    svr.Post("/api/link", [&](const httplib::Request& req, httplib::Response& res) {
        int from = extractInt(req.body, "from");
        int to = extractInt(req.body, "to");
        double weight = extractNumber(req.body, "weight");
        double bandwidth = extractNumber(req.body, "bandwidth");
        if (weight <= 0) weight = 1.0;
        if (bandwidth <= 0) bandwidth = 100.0;
        try {
            simulator.addLink(from, to, weight, bandwidth);
            res.set_content(simulator.getTopologyJSON(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content("{\"error\":\"" + std::string(e.what()) + "\"}", "application/json");
        }
    });

    // DELETE /api/link - Remove a link
    svr.Delete("/api/link", [&](const httplib::Request& req, httplib::Response& res) {
        int from = extractInt(req.body, "from");
        int to = extractInt(req.body, "to");
        simulator.removeLink(from, to);
        res.set_content(simulator.getTopologyJSON(), "application/json");
    });

    // POST /api/route - Compute shortest path
    svr.Post("/api/route", [&](const httplib::Request& req, httplib::Response& res) {
        int source = extractInt(req.body, "source");
        int destination = extractInt(req.body, "destination");
        auto result = simulator.findRoute(source, destination);
        res.set_content(result.toJSON(), "application/json");
    });

    // POST /api/simulate - Send a packet through the network
    svr.Post("/api/simulate", [&](const httplib::Request& req, httplib::Response& res) {
        int source = extractInt(req.body, "source");
        int destination = extractInt(req.body, "destination");
        std::string payload = extractString(req.body, "payload");
        if (payload.empty()) payload = "DATA";
        auto pkt = simulator.simulatePacket(source, destination, payload);
        res.set_content(pkt.toJSON(), "application/json");
    });

    // GET /api/stats - Get simulation statistics
    svr.Get("/api/stats", [&](const httplib::Request&, httplib::Response& res) {
        res.set_content(simulator.getStats().toJSON(), "application/json");
    });

    // GET /api/packets - Get packet log
    svr.Get("/api/packets", [&](const httplib::Request&, httplib::Response& res) {
        res.set_content(simulator.getPacketLogJSON(), "application/json");
    });

    std::cout << "\n";
    std::cout << "  ╔═══════════════════════════════════════════╗\n";
    std::cout << "  ║         AlgoNet Routing Simulator         ║\n";
    std::cout << "  ║                                           ║\n";
    std::cout << "  ║   Server running on http://localhost:" << port << "  ║\n";
    std::cout << "  ║   Press Ctrl+C to stop                    ║\n";
    std::cout << "  ╚═══════════════════════════════════════════╝\n";
    std::cout << "\n";

    svr.listen("0.0.0.0", port);
}

} // namespace algonet
