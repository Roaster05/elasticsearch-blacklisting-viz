import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { getHealth } from "../utils/getHealthStatus";
import Header from "../components/Header.jsx";

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddClusterModal, setShowAddClusterModal] = useState(false);
  const [showEditClusterModal, setShowEditClusterModal] = useState(false);
  const [newCluster, setNewCluster] = useState({
    name: "",
    url: "",
  });
  const [currentCluster, setCurrentCluster] = useState(null);
  const [filters, setFilters] = useState({
    identifierCount: false,
    queryCount: false,
    health: false,
  });

  // Load clusters from local storage when the component mounts
  useEffect(() => {
    const storedClusters = JSON.parse(localStorage.getItem("clusters"));
    console.log("Loaded clusters from local storage:", storedClusters);
    if (storedClusters) {
      setClusters(storedClusters);
    }
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCluster = async () => {
    try {
      const response = await axios.get(
        `${newCluster.url}/_cluster/state/clusterblacklist`
      );
      let clusterBlacklistString = response.data.cluster_blacklist || "";
      let entries = JSON.parse(clusterBlacklistString);

      const totalCount = entries.length;

      let healthStatus = getHealth(totalCount);

      const liveIdentifierBlacklisted = entries.filter(
        (entry) => parseInt(entry.ExecutionTime) > 5
      ).length;

      const clusterData = {
        name: response.data.cluster_name,
        uuid: response.data.cluster_uuid,
        url: newCluster.url,
        liveQueriesBlacklisted: totalCount,
        liveIdentifiersBlacklisted: liveIdentifierBlacklisted,
        health: healthStatus,
      };

      const updatedClusters = [...clusters, clusterData];
      setClusters(updatedClusters);
      localStorage.setItem("clusters", JSON.stringify(updatedClusters));

      setNewCluster({
        name: "",
        url: "",
      });

      setShowAddClusterModal(false);
    } catch (error) {
      console.error("Error fetching or processing cluster data:", error);
    }
  };

  const handleEditCluster = () => {
    const updatedClusters = clusters.map((cluster) =>
      cluster.uuid === currentCluster.uuid ? currentCluster : cluster
    );
    setClusters(updatedClusters);
    localStorage.setItem("clusters", JSON.stringify(updatedClusters));
    setShowEditClusterModal(false);
  };

  const handleDeleteCluster = (uuid) => {
    const updatedClusters = clusters.filter((cluster) => cluster.uuid !== uuid);
    setClusters(updatedClusters);
    localStorage.setItem("clusters", JSON.stringify(updatedClusters));
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.checked,
    });
  };

  const filteredClusters = clusters
    .filter((cluster) => {
      if (filters.health && cluster.health !== "Green") return false;
      return cluster.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (filters.queryCount) {
        return a.liveQueriesBlacklisted - b.liveQueriesBlacklisted;
      }
      if (filters.identifierCount) {
        return a.liveIdentifiersBlacklisted - b.liveIdentifiersBlacklisted;
      }
      return 0;
    });

  return (
    <main>
      <Header />
      <section className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-5 min-h-screen">
        <div className="mx-auto max-w-screen-xl px-4 lg:px-12">
          <div className="bg-white dark:bg-gray-900 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
              <div className="w-full md:w-1/2">
                <form className="flex items-center">
                  <label htmlFor="simple-search" className="sr-only">
                    Search for your cluster
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        aria-hidden="true"
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="simple-search"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      placeholder="Search"
                      required=""
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </form>
              </div>
              <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                <button
                  type="button"
                  className="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                  onClick={() => setShowAddClusterModal(true)}
                >
                  <svg
                    className="h-3.5 w-3.5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    />
                  </svg>
                  Add Cluster
                </button>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button
                    id="filterDropdownButton"
                    data-dropdown-toggle="filterDropdown"
                    className="w-full md:w-auto flex items-center justify-center py-2 px-4 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    type="button"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      className="h-4 w-4 mr-2 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Filter
                    <svg
                      className="-mr-1 ml-1.5 w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        clipRule="evenodd"
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      />
                    </svg>
                  </button>
                  {showFilterDropdown && (
                    <div
                      id="filterDropdown"
                      className="z-10 w-48 p-3 bg-white rounded-lg shadow dark:bg-gray-700"
                    >
                      <h6 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                        Filter by
                      </h6>
                      <ul
                        className="space-y-2 text-sm"
                        aria-labelledby="filterDropdownButton"
                      >
                        <li className="flex items-center">
                          <input
                            id="identifierCount"
                            name="identifierCount"
                            type="checkbox"
                            value=""
                            className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            onChange={handleFilterChange}
                          />
                          <label
                            htmlFor="identifierCount"
                            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Identifier Count
                          </label>
                        </li>
                        <li className="flex items-center">
                          <input
                            id="queryCount"
                            name="queryCount"
                            type="checkbox"
                            value=""
                            className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            onChange={handleFilterChange}
                          />
                          <label
                            htmlFor="queryCount"
                            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Query Count
                          </label>
                        </li>
                        <li className="flex items-center">
                          <input
                            id="health"
                            name="health"
                            type="checkbox"
                            value=""
                            className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                            onChange={handleFilterChange}
                          />
                          <label
                            htmlFor="health"
                            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            Health (Green)
                          </label>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto pt-12">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Cluster Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Last UUID Updated
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Live Queries Blacklisted
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Live Identifiers Blacklisted
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Health
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Actions
                    </th>
                    <th scope="col" className="px-4 py-3">
                      View Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClusters.map((cluster, index) => (
                    <tr
                      key={index}
                      className="border-b dark:border-gray-700 w-[100%]"
                    >
                      <td className="px-4 py-3">{cluster.name}</td>
                      <td className="px-4 py-3">{cluster.uuid}</td>
                      <td className="px-4 py-3">
                        {cluster.liveQueriesBlacklisted}
                      </td>
                      <td className="px-4 py-3">
                        {cluster.liveIdentifiersBlacklisted}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full text-white ${
                            cluster.health === "Green"
                              ? "bg-green-500"
                              : cluster.health === "Yellow"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {cluster.health}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteCluster(cluster.uuid)}
                          className="ml-2 text-red-600 hover:text-red-900 focus:outline-none"
                        >
                          Delete
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/cluster/${cluster.name}`}
                          className="font-bold"
                        >
                          Open Cluster
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {showAddClusterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Cluster
            </h3>
            <input
              type="text"
              placeholder="Cluster Name"
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newCluster.name}
              onChange={(e) =>
                setNewCluster({ ...newCluster, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="URL"
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={newCluster.url}
              onChange={(e) =>
                setNewCluster({ ...newCluster, url: e.target.value })
              }
            />
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none"
                onClick={handleAddCluster}
              >
                Add Cluster
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg focus:outline-none"
                onClick={() => setShowAddClusterModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditClusterModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Cluster
            </h3>
            <input
              type="text"
              placeholder="Cluster Name"
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentCluster.name}
              onChange={(e) =>
                setCurrentCluster({ ...currentCluster, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="URL"
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={currentCluster.url}
              onChange={(e) =>
                setCurrentCluster({ ...currentCluster, url: e.target.value })
              }
            />
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none"
                onClick={handleEditCluster}
              >
                Save Changes
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg focus:outline-none"
                onClick={() => setShowEditClusterModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
