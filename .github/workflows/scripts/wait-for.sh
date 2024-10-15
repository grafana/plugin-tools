#!/bin/bash

url="${WAIT_FOR_URL:-http://localhost:3000/}"
expected_response_code="${WAIT_FOR_RESPONSE_CODE:-200}"
timeout="${WAIT_FOR_TIMEOUT:-60000}"
interval="${WAIT_FOR_INTERVAL:-500}"
curl_timeout="${WAIT_FOR_CURL_TIMEOUT:-10}"

# Convert timeout and interval from milliseconds to seconds
timeout=$((timeout / 1000))
interval=$((interval / 1000))

echo "Checking URL: $url"
echo "Expected response code: $expected_response_code"
echo "Timeout: $timeout seconds"
echo "Interval: $interval seconds"

# $SECONDS is a special variable in bash, holds the number of seconds this script has been running
end_time=$((SECONDS + timeout))

while [ $SECONDS -lt $end_time ]; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -m "$curl_timeout" "$url")

  if [ "$response" -eq "$expected_response_code" ]; then
    echo "Server is up and responding with status code $expected_response_code"
    exit 0
  fi

  echo "Waiting for server to respond with status code $expected_response_code. Current status: $response"
  sleep $interval
done

echo "Timeout reached. Server did not respond with status code $expected_response_code within $timeout seconds"
exit 1
