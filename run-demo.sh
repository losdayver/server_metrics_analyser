#!/bin/bash

# Trap the SIGINT signal (Ctrl+C) and kill all the background processes
trap 'kill $pids; echo All running instances have been stopped; exit' SIGINT

# Change to the adapter directory
cd ./adapter

# Run the adapter executables in parallel
pids=""
for i in {1..6}; do
    ./exec/main 430$i Adapter-Stub-1 &
    pids+="$! "
done

for i in {7..9}; do
    ./exec/main 430$i Adapter-Stub-2 &
    pids+="$! "
done

# Change to the worker directory
cd ../worker

# Run the worker executables in parallel
for i in {1..4}; do
    ./exec/main 431$i &
    pids+="$! "
done

# Change to the controller directory
cd ../controller

# Run the controller executable
node main.mjs 4321 &
pids+="$! "

# Change to the console directory
cd ../console/src

# Run the console executable
node main.js &
pids+="$! "

echo All services ready
echo

sleep 1

for i in {1..5}; do
    curl -X POST http://127.0.0.1:4321/api/clusters/ -d "{
        \"HostName\": \"127.0.0.1\",
        \"Port\": \"430$i\"
    }" -H "Content-Type: application/json" -b "auth=temp-session"
    echo
done

for i in {1..4}; do
    curl -X POST http://127.0.0.1:4321/api/workers/ -d "{
        \"HostName\": \"127.0.0.1\",
        \"Port\": \"431$i\"
    }" -H "Content-Type: application/json" -b "auth=temp-session"
    echo
done

# Wait for all the executables to finish
wait $pids