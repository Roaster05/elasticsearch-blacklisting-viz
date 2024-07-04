import { Card, CardBody, Typography } from "@material-tailwind/react";
import axios from "axios";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { useParams } from "react-router-dom";
import { getHealth } from "../utils/getHealthStatus";
import { JsonFormatter } from "../components/json_formatter.jsx";
import Header from "../components/Header.jsx";

export default function Cluster() {
  const [payload, setPayload] = useState({});
  const [filter, setFilter] = useState("all");
  const [identifiers, setIdentifiers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [identifier, setIdentifier] = useState("");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(30);
  const { name } = useParams();
  const [hoveredRange, setHoveredRange] = useState(null);
  const [entriesInHoveredRange, setEntriesInHoveredRange] = useState([]);

  const fetchBlacklists = async (storedClusters) => {
    let currentClusterData = storedClusters.filter((cl) => name === cl.name)[0];
    const payload = (
      await axios.get(
        currentClusterData.url + "/_cluster/state/clusterblacklist"
      )
    ).data;
    // console.log(payload["cluster_blacklist"]);
    let jsonBlacklist = JSON.parse(payload["cluster_blacklist"]);
    payload["cluster_blacklist"] = jsonBlacklist.map((json) => ({
      ...json,
      Query: atob(json.Query),
    }));
    jsonBlacklist = payload["cluster_blacklist"];
    const ids = [...new Set(jsonBlacklist.map((json) => json.Identifier))];
    const queries = [...new Set(jsonBlacklist.map((json) => json.Query))];
    setIdentifiers(ids);
    setIdentifier(ids[0]);
    setQueries(queries);
    setQuery(queries[0]);
    setPayload(payload);

    currentClusterData = {
      ...currentClusterData,
      uuid: payload.cluster_uuid,
      liveQueriesBlacklisted: queries.length,
      liveIdentifiersBlacklisted: ids.length,
      health: getHealth(jsonBlacklist.length),
    };

    storedClusters = storedClusters.map((cl) => {
      if (name !== cl.name) return cl;
      else return currentClusterData;
    });

    localStorage.setItem("clusters", JSON.stringify(storedClusters));
  };

  useEffect(() => {
    async function set_payload() {
      const clustersStored = await JSON.parse(localStorage.getItem("clusters"));
      await fetchBlacklists(clustersStored);
    }
    set_payload();
  }, []);

  const getSlotMinute = (minute) => Math.floor(minute / range) * range;

  const getKey = (t) => {
    let hr = t.getHours();
    let min = t.getMinutes();
    hr = hr.toString().padStart(2, "0");
    min = min.toString().padStart(2, "0");
    return hr + ":" + min;
  };

  const getBlacklistArray = () => {
    if (filter === "all") return payload.cluster_blacklist;
    else if (filter === "id")
      return payload.cluster_blacklist.filter(
        (json) => json["Identifier"] === identifier
      );
    return payload.cluster_blacklist.filter((json) => json["Query"] === query);
  };

  const smoothData = (data) => {
    const smoothedData = {};
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];
      let smoothedValue = data[currentKey];

      if (i > 0) {
        smoothedValue = (smoothedValue + data[keys[i - 1]]) / 2;
      }
      if (i < keys.length - 1) {
        smoothedValue = (smoothedValue + data[keys[i + 1]]) / 2;
      }

      smoothedData[currentKey] = smoothedValue;
    }

    return smoothedData;
  };

  const getData = () => {
    const blacklistArray = getBlacklistArray();
    const timestamps = blacklistArray.map((bl) => bl.Timestamp);

    let data = {};
    const currentTime = new Date();
    const currentMinute = currentTime.getMinutes();

    let startTime = currentTime;
    startTime.setMinutes(getSlotMinute(currentMinute), 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() - 12);

    while (startTime >= endTime) {
      data[getKey(startTime)] = 0;
      startTime = new Date(startTime.getTime() - range * 60 * 1000);
    }

    timestamps.forEach((ts) => {
      const tsTime = new Date(ts);
      tsTime.setMinutes(getSlotMinute(tsTime.getMinutes()), 0, 0);
      ++data[getKey(tsTime)];
    });

    const X = Object.keys(data)
      .reverse()
      .map((key) => {
        const minute = key.slice(-3);
        if (minute == ":00") return key.slice(0, 2);
        else return minute;
      });

    let Y = Object.values(data)
      .reverse()
      .map((val) => {
        if (isNaN(val)) return 0;
        return val;
      });

    return { X, Y };
  };

  const getChartConfig = () => {
    const { X, Y } = getData();

    const chartConfig = {
      type: "line",
      height: 500,
      series: [
        {
          name: "Blacklists",
          data: Y,
        },
      ],
      options: {
        chart: {
          toolbar: {
            show: false,
          },
          events: {
            dataPointMouseEnter: function (event, chartContext, config) {
              const hoveredRange =
                config.w.globals.categoryLabels[config.dataPointIndex];
              setHoveredRange(hoveredRange);
            },
          },
        },
        title: {
          show: "",
        },
        dataLabels: {
          enabled: false,
        },
        colors: ["#4fb3f9"],
        stroke: {
          lineCap: "round",
          curve: "smooth",
        },
        markers: {
          size: 0,
        },
        xaxis: {
          axisTicks: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
          categories: X,
        },
        yaxis: {
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
        },
        grid: {
          show: true,
          borderColor: "#6c83a0",
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 20,
            right: 20,
            left: 20,
          },
        },
        fill: {
          opacity: 0.8,
        },
        tooltip: {
          theme: "dark",
        },
      },
    };
    return chartConfig;
  };

  // Function to get execution time data for the histogram chart
  const getExecutionTimeData = () => {
    const blacklistArray = getBlacklistArray();
    const executionTimes = blacklistArray
      .filter((bl) => bl.ExecutionTime)
      .map((bl) => bl.ExecutionTime);

    const rangeSize = 1000; // Define the size of each range
    const ranges = {};
    executionTimes.forEach((time) => {
      const rangeKey = Math.floor(time / rangeSize) * rangeSize;
      ranges[rangeKey] = (ranges[rangeKey] || 0) + 1;
    });

    const X = Object.keys(ranges).map(
      (key) => `${key}-${Number(key) + rangeSize}`
    );
    const Y = Object.values(ranges);

    return { X, Y };
  };

  // Function to get chart configuration for the execution time histogram
  const getExecutionTimeChartConfig = () => {
    const { X, Y } = getExecutionTimeData();

    const chartConfig = {
      type: "bar",
      height: 500,
      series: [
        {
          name: "Execution Times",
          data: Y,
        },
      ],
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        title: {
          text: "Execution Times Distribution",
          align: "center",
          style: {
            color: "#ffffff",
          },
        },
        dataLabels: {
          enabled: false,
        },
        colors: ["#ff7f0e"],
        xaxis: {
          categories: X,
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
        },
        grid: {
          show: true,
          borderColor: "#6c83a0",
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 20,
            right: 20,
            left: 20,
          },
        },
        tooltip: {
          theme: "dark",
        },
      },
    };
    return chartConfig;
  };

  const getNodeData = () => {
    const blacklistArray = getBlacklistArray();
    const nodesCount = {};

    blacklistArray.forEach((bl) => {
      const node = bl.Node;
      if (nodesCount[node]) {
        nodesCount[node]++;
      } else {
        nodesCount[node] = 1;
      }
    });

    const X = Object.keys(nodesCount);
    const Y = Object.values(nodesCount);

    return { X, Y };
  };

  // Function to get chart configuration for the execution time histogram
  const getNodeChartConfig = () => {
    const { X, Y } = getNodeData();

    const chartConfig = {
      type: "bar",
      height: 500,
      series: [
        {
          name: "Node Counts",
          data: Y,
        },
      ],
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        title: {
          text: "Nodes vs Blacklisted Count",
          align: "center",
          style: {
            color: "#ffffff",
          },
        },
        dataLabels: {
          enabled: false,
        },
        colors: ["#74c159"],
        xaxis: {
          categories: X,
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: "#ffffff",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
        },
        grid: {
          show: true,
          borderColor: "#6c83a0",
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 20,
            right: 20,
            left: 20,
          },
        },
        tooltip: {
          theme: "dark",
        },
      },
    };
    return chartConfig;
  };

  function truncateString(str, num) {
    return str.length > num ? str.substring(0, num) + "..." : str;
  }

  useEffect(() => {
    if (hoveredRange) {
      const blacklistArray = getBlacklistArray();
      const entries = blacklistArray.filter((entry) => {
        const entryTime = new Date(entry.Timestamp);
        const entryKey = getKey(entryTime);
        return entryKey === hoveredRange;
      });
      setEntriesInHoveredRange(entries);
    }
  }, [hoveredRange]);

  return Object.keys(payload).length === 0 ? (
    <div className="w-[100vw] h-[100vh] bg-gray-700 flex justify-center items-center">
      Loading...
    </div>
  ) : (
    <div className="flex flex-col bg-gray-800 h-[100vh] text-white">
      <Header />
      <div className="flex justify-around items-center">
        <div>
          <span className="font-bold text-[#4fb3f9]">Cluster name: </span>
          <span>{payload.cluster_name} </span>
        </div>
        <div>
          <span className="font-bold text-[#4fb3f9]">Cluster UUID: </span>
          <span>{payload.cluster_uuid} </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="my-2 font-bold text-[#4fb3f9]">Time Interval</span>
          <form>
            <select
              id="time"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value={60}>1 Hour</option>
              <option value={30}>30 Min</option>
              <option value={15}>15 Min</option>
            </select>
          </form>
        </div>
        <div className="flex flex-col items-center text-[#4fb3f9]">
          <span className="my-2 font-bold">Filter</span>
          <form>
            <select
              id="filter"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="id">Identifier</option>
              <option value="query">Query</option>
            </select>
          </form>
        </div>
        {filter !== "all" && (
          <div className="flex flex-col items-center mt-5">
            <form className="flex flex-col items-center ">
              <label
                htmlFor="choose"
                className="block mb-2 text-[#4fb3f9] font-bold"
              >
                {filter === "id" ? "Choose Identifier" : "Choose Query"}
              </label>
              <select
                id="choose"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={filter === "id" ? identifier : query}
                onChange={(e) => {
                  filter === "id"
                    ? setIdentifier(e.target.value)
                    : setQuery(e.target.value);
                }}
              >
                {filter === "id"
                  ? identifiers.map((id) => <option value={id}>{id}</option>)
                  : queries.map((q) => (
                      <option value={q}> {truncateString(q, 15)} </option>
                    ))}
              </select>
            </form>
          </div>
        )}
      </div>

      <div className="flex items-center px-6 mt-8">
        <Card className="bg-gray-900 w-full rounded-lg">
          <CardBody className="px-2 pb-0 ">
            <Chart {...getChartConfig()} />
          </CardBody>
        </Card>

        {filter === "query" && (
          <div className="flex flex-col items-center relative top-6">
            <span className="font-bold text-[#4fb3f9]">Query:</span>
            <JsonFormatter jsonString={query} />
          </div>
        )}
      </div>

      <div className="flex items-center px-6 mt-8">
        <Card className="bg-gray-900 w-full rounded-lg">
          <CardBody className="px-2 pb-0 ">
            <Chart {...getExecutionTimeChartConfig()} />
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center px-6 mt-8">
        <Card className="bg-gray-900 w-full rounded-lg">
          <CardBody className="px-2 pb-0 ">
            <Chart {...getNodeChartConfig()} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
