document.addEventListener("DOMContentLoaded", function () {
    const filterButton = document.getElementById("filterButton");
    const table = document.querySelector(".logTable"); 

    // =========================== SOCKET IO =============================== //

    // Create a Socket.IO connection
    const socket = io.connect('http://localhost:5001', {
      transports: ['websocket', 'polling'], 
      reconnectionAttempts: 5,
      reconnectionDelay: 1000, 
      debug: true 
    });

    socket.on('connect', function() {
      console.log('WebSocket connected');
    });

    socket.on('connect_error', function(error) {
      console.error('WebSocket connection failed:', error);
    });

    // Listen for incoming logs and update table
    socket.on('new_log', function(logData) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${logData.id}</td>
            <td>${logData.timestamp}</td>
            <td>${logData.original_source}</td>
            <td>${logData.threat_level}</td>
            <td class="pdf" onclick="downloadPdf(this)">
                <img id="downloadLogsAsPDF" src="/static/images/pdf.png" alt="Click to download">
            </td>
        `;

        row.addEventListener('click', function() {
            rowClicked(row);
        });

        // Color-code the row based on threat level
        const threatLevel = parseInt(row.cells[3].textContent.trim());
        const colors = [
            "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
            "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
        ];

        if (!isNaN(threatLevel) && threatLevel >= 1 && threatLevel <= 10) {
            const color = colors[threatLevel - 1];
            row.style.backgroundColor = color;
        }

        table.appendChild(row);
        updateChart();
    });

    // ============================== LOG TABLE ============================== //

    // Filter logs by threat level
    function filterLogs(logs, filter) {
        if (filter === "all") {
            return logs;
        }

        if (filter === "low") {
            return logs.filter(log => log.threat_level >= 1 && log.threat_level <= 3);
        } else if (filter === "medium") {
            return logs.filter(log => log.threat_level >= 4 && log.threat_level <= 7);
        } else if (filter === "high") {
            return logs.filter(log => log.threat_level >= 8 && log.threat_level <= 10);
        }

        return logs;
    }

   // Load and render logs into the table
    function loadLogs(filter = "all") {
        fetch('/logs/get_latest_logs')
            .then(response => response.json())
            .then(data => {
                // Remove old logs
                const existingRows = table.querySelectorAll("tr:nth-child(n+2)");
                existingRows.forEach(row => row.remove());

                // Filter logs based on users choice 
                const filteredData = filterLogs(data, filter);  

                // Add new rows in table 
                filteredData.forEach(log => {
                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${log.id}</td>
                        <td>${log.timestamp}</td>
                        <td>${log.original_source}</td>
                        <td>${log.threat_level}</td>
                        <td class="pdf" onclick="downloadPdf(this)">
                            <img id="downloadLogsAsPDF" src="/static/images/pdf.png" alt="Click to download">
                        </td>
                    `;

                    row.addEventListener('click', function() {
                        rowClicked(row);
                    });

                    
                    const threatLevel = parseInt(row.cells[3].textContent.trim());
                    const colors = [
                        "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
                        "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
                    ];

                    if (!isNaN(threatLevel) && threatLevel >= 1 && threatLevel <= 10) {
                        const color = colors[threatLevel - 1];
                        row.style.backgroundColor = color;
                    }

                    table.appendChild(row);
                });
            });
    }

    // Handle filter dropdown changes
    filterButton.addEventListener("change", function(event) {
        const filter = event.target.value;  
        loadLogs(filter);  
    });

    // Load all logs initially
    loadLogs("all");  

    // Periodically refresh the log list
    setInterval(() => loadLogs(filterButton.value), 10000);
});


// ================================ POPUP TABLE ============================== //
function rowClicked(row) {
    var logId = row.cells[0].innerText.trim();
    logId = logId.replace(/[^\d]/g, '');
    
    console.log("Log ID is:", logId); 

    if (!logId || isNaN(logId)) {
        console.error("Invalid log ID:", logId);
        return; 
    }
    
    var threatLevel = parseInt(row.cells[3].innerText.trim(), 10);

    console.log("Row clicked with ID:", logId);
    
    fetch(`/logs/get_log_details/${logId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("logId").textContent = data.id;
            document.getElementById("logDataIp").textContent = data.ip;
            document.getElementById("logDataTimestamp").textContent = data.timestamp;
            document.getElementById("logDataSource").textContent = data.original_source;
            document.getElementById("logDataThreatLevel").textContent = data.threat_level;
            document.getElementById("logDataMessage").textContent = data.log_message;
            document.getElementById("logDataRiskDescription").textContent = data.risk_description;

            
            document.querySelector(".popUp").classList.add("open");
            document.querySelector(".popUp").style.display = "block";

            
            const logHeader = document.querySelector(".popUp .header");
            const colors = [
                "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
                "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
            ];

            if (!isNaN(threatLevel) && threatLevel >= 1 && threatLevel <= 10) {
                logHeader.style.backgroundColor = colors[threatLevel - 1];
                logHeader.style.color = threatLevel >= 8 ? "white" : "black";
            }
        });
}


function closePopup() {
    
    document.querySelector(".popUp").classList.remove("open");
    document.querySelector(".popUp").style.display = "none";
}



function downloadPdf(element) {
    let row = element.closest('tr');
    let logId = row.cells[0].innerText;

    
    fetch(`/logs/get_log_details/${logId}`)
        .then(response => response.json())
        .then(data => {
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(`Log ID: ${data.id}`, 10, 10);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Timestamp: ${data.timestamp}`, 10, 20);
            doc.text(`Source: ${data.original_source}`, 10, 30);
            doc.text(`Threat Level: ${data.threat_level}`, 10, 50);

            const logMessage = data.log_message;
            const logMessageY = 60;
            const logMessageLines = doc.splitTextToSize(logMessage, 180); 

            doc.text("Log Message: ", 10, logMessageY);
            logMessageLines.forEach((line, index) => {
                doc.text(line, 10, logMessageY + 10 + (index * 10));
            });

            const nextY = logMessageY + logMessageLines.length * 10 + 10;  


            const riskDescription = data.risk_description;
            const riskDescriptionLines = doc.splitTextToSize(riskDescription, 180); 
            doc.text(`IP: ${data.ip}`, 10, nextY);
            doc.text(`Risk Description: `, 10, nextY + 20); 

            riskDescriptionLines.forEach((line, index) => {
                doc.text(line, 10, nextY + 30 + (index * 10)); 
            });

            const finalY = nextY + riskDescriptionLines.length * 10 + 10; 
            
            doc.save(`Log_${data.id}.pdf`);
        })
        .catch(error => {
            console.error('Error fetching log details:', error);
        });
}


  function exportToExcel() {
   
    var table = document.querySelector(".riskTable"); 

    
    var wb = XLSX.utils.table_to_book(table, { sheet: "Sheet 1" });

    
    XLSX.writeFile(wb, "risk_table.xlsx");
}


// =============== LOG PIE CHART  ================ //

document.addEventListener("DOMContentLoaded", function () {
    let logPieChart; 

    function fetchAndRenderLogs() {
        fetch('/logs/get_latest_logs_14d')
            .then(response => response.json())
            .then(data => {
                console.log("Data hämtad från API:", data); 

                const today = new Date();
                const fourteenDaysAgo = new Date(today);
                fourteenDaysAgo.setDate(today.getDate() - 14);

                
                const filteredLogs = data.filter(log => {
                    const logDateStr = log.timestamp.replace(' ', 'T');
                    const logDate = new Date(logDateStr);
                    return !isNaN(logDate) && logDate >= fourteenDaysAgo;
                });

                console.log("Filtrerade loggar:", filteredLogs);

                const threatLevelCount = Array(10).fill(0);
                let totalThreatLevel = 0;
                let totalLogs = 0;  

                filteredLogs.forEach(log => {
                    const threatLevel = parseInt(log.threat_level);
                    if (!isNaN(threatLevel) && threatLevel >= 1 && threatLevel <= 10) {
                        threatLevelCount[threatLevel - 1]++;
                        totalThreatLevel += threatLevel;
                        totalLogs++;  
                    }
                });

                console.log("Threat level count:", threatLevelCount); 

                if (threatLevelCount.every(count => count === 0)) {
                    console.warn("Inga hotnivå-loggar hittades.");
                    return;
                }

                // Calculate the average threat level
                const averageThreatLevel = totalLogs > 0 ? (totalThreatLevel / totalLogs).toFixed(2) : 0;

                const labels = [
                    'Threat Level: 1', 'Threat Level: 2', 'Threat Level: 3', 'Threat Level: 4',
                    'Threat Level: 5', 'Threat Level: 6', 'Threat Level: 7', 'Threat Level: 8',
                    'Threat Level: 9', 'Threat Level: 10'
                ];

                const chartData = {
                    labels: labels,
                    datasets: [{
                        data: threatLevelCount,
                        backgroundColor: [
                            "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
                            "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
                        ]
                    }]
                };

                const chartCanvas = document.getElementById('logPieChart');
                if (!chartCanvas) {
                    console.error("Elementet #logPieChart hittades inte i HTML.");
                    return;
                }

                if (!logPieChart) {
                    logPieChart = new Chart(chartCanvas, {
                        type: 'doughnut',
                        data: chartData,
                        options: {
                            responsive: true,
                            plugins: {
                                tooltip: {
                                    enabled: true,
                                },
                                legend: {
                                    position: 'right',
                                    labels: {
                                    usePointStyle: true,
                                    padding: 20
                                    }
                                },
                                datalabels: {
                                    display: true,
                                    color: '#000',
                                    font: {
                                        weight: 'bold',
                                        size: 18
                                    },
                                    formatter: function (value, ctx) {
                                        return null; 
                                    }
                                }
                            },
                            elements: {
                                center: {
                                    fontStyle: 'Arial',
                                    fontSize: 20,
                                    fontColor: '#000',
                                    fontWeight: 'bold',
                                    text: `Avg: ${averageThreatLevel}`
                                }
                            }
                        }
                    });
                } else {
                    logPieChart.data.datasets[0].data = threatLevelCount;
                    logPieChart.update();
                }
            })
            .catch(error => {
                console.error('Error fetching logs:', error);
            });
    }


    fetchAndRenderLogs();

    setInterval(fetchAndRenderLogs, 10000);
});

// =================== LIVE GRAPH =================== //

document.addEventListener("DOMContentLoaded", function () {
    let myChart; 

    function fetchAndRenderLiveGraph() {
        fetch('/logs/get_latest_logs')
            .then(response => response.json())
            .then(data => {
                console.log("Data hämtad från API:", data);

                const timestamps = [];
                const threatLevels = [];
                const pointColors = [];
                const colors = [
                    "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
                    "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
                ];

                const now = new Date();
                const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));  

                data.forEach(log => {
                    const logDate = new Date(log.timestamp);
                    if (logDate >= oneHourAgo) {
                        timestamps.push(logDate.toLocaleTimeString());  
                        threatLevels.push(parseInt(log.threat_level));
                        pointColors.push(colors[log.threat_level - 1]);
                    }
                });


                timestamps.reverse();
                threatLevels.reverse();
                pointColors.reverse();

                
                const chartCanvas = document.getElementById("myChart");
                if (!chartCanvas) {
                    console.error("Canvas-elementet med ID 'myChart' hittades inte.");
                    return;
                }

                
                if (!myChart) {
                    myChart = new Chart(chartCanvas, {
                        type: "line",
                        data: {
                            labels: timestamps,
                            datasets: [{
                                label: 'Threat Level',
                                data: threatLevels,
                                borderColor: "red",
                                backgroundColor: pointColors,
                                pointBackgroundColor: pointColors,
                                pointBorderColor: "#000",
                                pointRadius: 5,
                                fill: false
                            }]
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Threat Level'
                                    },
                                    ticks: {
                                        stepSize: 1
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Time (Last Hour)'
                                    },
                                    ticks: {
                                        autoSkip: true,
                                        maxRotation: 45,
                                        minRotation: 45
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            return `Threat Level: ${context.parsed.y}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    myChart.data.labels = timestamps;
                    myChart.data.datasets[0].data = threatLevels;
                    myChart.data.datasets[0].pointBackgroundColor = pointColors;
                    myChart.update();
                }
            })
            .catch(error => {
                console.error('Error fetching logs:', error);
            });
    }

    fetchAndRenderLiveGraph();
    setInterval(fetchAndRenderLiveGraph, 10000);
});




// =============================== BAR CHART ================================ //

document.addEventListener("DOMContentLoaded", function () {
    let barChart;

    function fetchAndRenderBarChart() {
        fetch('/logs/get_latest_logs')
            .then(response => response.json())
            .then(data => {
                console.log("Data for Bar Chart:", data);

                const threatLevelCounts = Array(10).fill(0);
                const colors = [
                    "#32CD32", "#00FF00", "#99FF33", "#CCFF33", "#FFFF00",
                    "#FFCC00", "#FF9900", "#FF6600", "#FF3300", "#FF0000"
                ];

                
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

                
                data.forEach(log => {
                    const logTime = new Date(log.timestamp);
                    const threatLevel = parseInt(log.threat_level);

                    if (logTime >= twentyFourHoursAgo && logTime <= now && threatLevel >= 1 && threatLevel <= 10) {
                        threatLevelCounts[threatLevel - 1] += 1;
                    }
                });

                const labels = Array.from({ length: 10 }, (_, i) => `${i + 1}`);
                const chartCanvas = document.getElementById("logBarChart");

                if (!chartCanvas) {
                    console.error("Canvas-elementet med ID 'logBarChart' hittades inte.");
                    return;
                }

                if (!barChart) {
                    barChart = new Chart(chartCanvas, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Logs in Last 24 Hours per Threat Level',
                                data: threatLevelCounts,
                                backgroundColor: colors,
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Threat Level (1-10)'
                                    }
                                },
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Logs'
                                    },
                                    ticks: {
                                        precision: 0
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function (context) {
                                            return `Threat Level ${context.label}: ${context.raw}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    barChart.data.labels = labels;
                    barChart.data.datasets[0].data = threatLevelCounts;
                    barChart.update();
                }
            })
            .catch(error => {
                console.error('Error fetching logs for Bar Chart:', error);
            });
    }

    
    fetchAndRenderBarChart();

   
    setInterval(fetchAndRenderBarChart, 10000);
});





