cmake_minimum_required(VERSION 3.14)
project(AlgoNet VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Find required packages
find_package(Threads REQUIRED)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/src
)

# Source files
set(SOURCES
    src/main.cpp
    src/core/Graph.cpp
    src/algorithms/Dijkstra.cpp
    src/simulator/NetworkSimulator.cpp
    src/api/Server.cpp
)

# Build executable
add_executable(algonet_server ${SOURCES})

# Link libraries
target_link_libraries(algonet_server
    Threads::Threads
)

# Platform-specific settings
if(APPLE)
    target_compile_definitions(algonet_server PRIVATE CPPHTTPLIB_USE_CERTS_FROM_MACOSX_KEYCHAIN)
endif()
