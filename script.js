const geocodeURL = "https://geocoding-api.open-meteo.com/v1/search";
const dataURL = "https://meteostat.p.rapidapi.com/point/daily";

const ctx = document.getElementById("myChart").getContext("2d");

let currentDates = [];
let currentTempsCelsius = [];
let currentCityName = "";

let myChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [{
            label: "",
            data: [],
            fill: false,
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                ticks: {
                    maxTicksLimit: 10
                }
            }],
            yAxes: [{
                ticks: {
                    beginAtZero: true
                },
                scaleLabel: {
                    display: true,
                    labelString: "Temperature in Celsius"
                }
            }]
        }
    }
});

document.getElementById("unit").addEventListener("change", updateChart);

async function getData() {
    const city = document.getElementById("city").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!(city && startDate && endDate)) {
        alert("Please input all data.");
        return;
    }

    let geoUrl = new URL(geocodeURL);
    geoUrl.search = new URLSearchParams({
        name: city,
        count: 1
    });

    try {
        let geoPromise = await fetch(geoUrl);
        let geoData = await geoPromise.json();

        if (!geoData.results || geoData.results.length === 0) {
            alert("Could not find coordinates for the provided city.");
            return;
        }

        const lat = geoData.results[0].latitude;
        const lon = geoData.results[0].longitude;
        currentCityName = geoData.results[0].name;

        const graphData = await retrieveData(lat, lon, startDate, endDate);

        if (!graphData) return;

        currentDates = graphData.xDates;
        currentTempsCelsius = graphData.yTemps;

        updateChart();

    } catch (error) {
        console.error(error);
        alert("An error occurred while fetching the data.");
    }
}

async function retrieveData(lat, lon, start, end) {
    const xDates = [];
    const yTemps = [];

    let url = new URL(dataURL);
    url.search = new URLSearchParams({
        lat: lat,
        lon: lon,
        start: start,
        end: end
    });

    let promise = await fetch(url, {
        headers: {
            "x-rapidapi-host": "meteostat.p.rapidapi.com",
            "x-rapidapi-key": MY_API_KEY
        }
    });

    let result = await promise.json();

    if (result.data && result.data.length > 0) {
        for (const day of result.data) {
            xDates.push(day.date);
            yTemps.push(day.tavg);
        }
        return { xDates, yTemps };
    } else {
        alert("No weather data available for this city and date range.");
        return false;
    }
}

function updateChart() {
    if (currentTempsCelsius.length === 0) return;

    const selectedUnit = document.getElementById("unit").value;
    let displayTemps = [];
    let yAxisLabel = "";

    if (selectedUnit === "fahrenheit") {
        displayTemps = currentTempsCelsius.map(temp => (temp * 9/5) + 32);
        yAxisLabel = "Temperature in Fahrenheit";
    } else {
        displayTemps = currentTempsCelsius;
        yAxisLabel = "Temperature in Celsius";
    }

    const newData = {
        label: `Average temperature in ${currentCityName}`,
        data: displayTemps,
        fill: false,
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1
    };

    myChart.data.datasets[0] = newData;
    myChart.data.labels = currentDates;

    myChart.options.scales.yAxes[0].scaleLabel.labelString = yAxisLabel;

    myChart.update();
}

function toggleSidebar() {
    const sidebar = document.getElementById("mySidebar");
    sidebar.classList.toggle("open");
}
