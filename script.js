// =============================================================================
// Atmospheric Editorial Weather App - JavaScript Implementation
// Beginner-friendly, modular structure utilizing WeatherAPI.com & Axios
// =============================================================================

// WeatherAPI.com Key (Preserved exactly from original project)
const apiKey = "681c4c0fdf884b0287175040261609";

// Primary DOM Elements (Preserved existing IDs)
const para = document.querySelector("#show-weather");
const humidity = document.querySelector("#show-humidity");
const cityName = document.querySelector("#show-city");
const condition = document.querySelector("#show-condition");
const feelsLike = document.querySelector("#show-feels");
const wind = document.querySelector("#show-wind");
const error = document.querySelector("#error");

// Extended UI Elements for Editorial Interface
const appContainer = document.querySelector("#app-container");
const dayDateEl = document.querySelector("#show-day-date");
const localTimeEl = document.querySelector("#show-local-time");
const heroIconEl = document.querySelector("#hero-weather-icon");
const tempUnitSymbol = document.querySelector("#temp-unit-symbol");

const astroPrimaryTag = document.querySelector("#astro-primary-tag");
const astroPaletteDesc = document.querySelector("#astro-palette-desc");
const astroMainTime = document.querySelector("#astro-main-time");
const astroMainAmpm = document.querySelector("#astro-main-ampm");

const showRain = document.querySelector("#show-rain");
const showSnow = document.querySelector("#show-snow");
const showUv = document.querySelector("#show-uv");
const showCloud = document.querySelector("#show-cloud");
const showPressure = document.querySelector("#show-pressure");
const showVisVal = document.querySelector("#show-visibility-val");
const showVisUnit = document.querySelector("#show-visibility-unit");
const visFillBar = document.querySelector("#vis-fill-bar");

const astroSunrise = document.querySelector("#astro-sunrise");
const astroSunset = document.querySelector("#astro-sunset");
const astroMoonPhase = document.querySelector("#astro-moon-phase");
const astroMoonIllum = document.querySelector("#astro-moon-illum");

const hourlyContainer = document.querySelector("#hourly-forecast-container");
const unitCBtn = document.querySelector("#unit-c-btn");
const unitFBtn = document.querySelector("#unit-f-btn");

// Global State
let currentUnit = "C"; // 'C' for Celsius, 'F' for Fahrenheit
let cachedWeatherData = null; // Stores last fetched response for instant unit toggle

// -----------------------------------------------------------------------------
// 1. Weather Icon Generator (Minimal, elegant inline SVGs)
// -----------------------------------------------------------------------------
function getWeatherSvg(conditionText, isDay = 1) {
  const text = (conditionText || "").toLowerCase();

  // Thunderstorm
  if (text.includes("thunder") || text.includes("storm")) {
    return `<svg viewBox="0 0 24 24"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><polyline points="13 11 9 17 15 17 11 23"></polyline></svg>`;
  }
  // Snow / Sleet / Ice / Blizzard
  if (text.includes("snow") || text.includes("sleet") || text.includes("ice") || text.includes("blizzard")) {
    return `<svg viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line></svg>`;
  }
  // Rain / Drizzle / Shower
  if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) {
    return `<svg viewBox="0 0 24 24"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path><line x1="8" y1="19" x2="8" y2="21"></line><line x1="12" y1="19" x2="12" y2="21"></line><line x1="16" y1="19" x2="16" y2="21"></line></svg>`;
  }
  // Cloudy / Overcast / Mist / Fog
  if (text.includes("cloud") || text.includes("overcast") || text.includes("mist") || text.includes("fog")) {
    return `<svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`;
  }
  // Night Clear
  if (!isDay) {
    return `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
  // Sunny / Clear Day (Default)
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
}

// -----------------------------------------------------------------------------
// 2. Dynamic Atmospheric Theme Engine
// Evaluates condition, local time, sunrise, and sunset
// -----------------------------------------------------------------------------
function parseTimeToMinutes(timeStr) {
  // Parses "06:19 AM" or "06:31 PM" or "22:00" into minutes from midnight
  if (!timeStr) return 0;
  
  const trimmed = timeStr.trim();
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const parts = trimmed.split(" ");
    const [hours, minutes] = parts[0].split(":").map(Number);
    let total = (hours % 12) * 60 + minutes;
    if (parts[1].toUpperCase() === "PM") {
      total += 12 * 60;
    }
    return total;
  }
  
  // "YYYY-MM-DD HH:MM" or "HH:MM"
  const timeOnly = trimmed.includes(" ") ? trimmed.split(" ")[1] : trimmed;
  const [hours, minutes] = timeOnly.split(":").map(Number);
  return hours * 60 + minutes;
}

function determineAtmosphericTheme(weather) {
  const conditionText = (weather.current.condition.text || "").toLowerCase();
  const isDay = weather.current.is_day;
  const localTimeStr = weather.location.localtime; // e.g. "2026-09-19 22:00"
  const currentMinutes = parseTimeToMinutes(localTimeStr);
  
  const astro = weather.forecast?.forecastday?.[0]?.astro;
  const sunriseMinutes = astro ? parseTimeToMinutes(astro.sunrise) : 6 * 60; // default 6:00 AM
  const sunsetMinutes = astro ? parseTimeToMinutes(astro.sunset) : 18 * 60 + 30; // default 6:30 PM

  // Priority 1: Rainy / Stormy weather condition
  if (
    conditionText.includes("rain") ||
    conditionText.includes("drizzle") ||
    conditionText.includes("shower") ||
    conditionText.includes("thunder") ||
    conditionText.includes("snow") ||
    conditionText.includes("sleet")
  ) {
    return {
      themeClass: "theme-rainy",
      tag: "RAIN ATMOSPHERE",
      paletteDesc: "MUTED SLATE, DRIZZLE, & OVERCAST"
    };
  }

  // Priority 2: Sunrise window (45 min before to 60 min after sunrise)
  if (currentMinutes >= sunriseMinutes - 45 && currentMinutes <= sunriseMinutes + 60) {
    return {
      themeClass: "theme-sunrise",
      tag: "TODAY'S SUNRISE",
      paletteDesc: "FIRST LIGHT, AMBER, & PALE AZURE"
    };
  }

  // Priority 3: Sunset window (60 min before to 45 min after sunset)
  if (currentMinutes >= sunsetMinutes - 60 && currentMinutes <= sunsetMinutes + 45) {
    return {
      themeClass: "theme-sunset",
      tag: "TODAY'S SUNSET",
      paletteDesc: "SHADES OF SCARLET, ORANGE, & LAVENDER"
    };
  }

  // Priority 4: Daytime sunny / clear
  if (isDay === 1) {
    return {
      themeClass: "theme-sunny",
      tag: "TODAY'S SUNSET",
      paletteDesc: "WARM RADIANCE, GOLD, & OPEN SKY"
    };
  }

  // Priority 5: Nighttime
  return {
    themeClass: "theme-night",
    tag: "TODAY'S SUNSET",
    paletteDesc: "MIDNIGHT NAVY, TWILIGHT, & CELESTIAL INDIGO"
  };
}

// -----------------------------------------------------------------------------
// 3. UI Update Helpers: Sliders & Vertical Indicators
// -----------------------------------------------------------------------------
function setIndicator(fillId, tickId, percent) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const fill = document.getElementById(fillId);
  const tick = document.getElementById(tickId);
  if (fill) fill.style.height = `${clamped}%`;
  if (tick) tick.style.bottom = `${clamped}%`;
}

// -----------------------------------------------------------------------------
// 4. Main Weather Fetching Function (Preserving original signature)
// -----------------------------------------------------------------------------
async function getWeather(event) {
  if (event) {
    event.preventDefault();
  }

  const cityInput = document.querySelector("#city-input");
  const city = cityInput.value.trim();

  if (!city) {
    return;
  }

  error.innerHTML = "";

  try {
    // Upgraded endpoint to forecast.json (2 days) for upcoming hours and astronomy data
    const response = await axios(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=2&aqi=no&alerts=no`
    );

    console.log("WeatherAPI Response:", response.data);

    // Cache the data for instantaneous Celsius/Fahrenheit switches
    cachedWeatherData = response.data;

    // Render the entire interface
    renderWeatherData(cachedWeatherData);

  } catch (err) {
    console.error("Error fetching weather data:", err);

    error.innerHTML = "City not found. Please check spelling and try again.";

    cityName.innerHTML = "Search for a city";
    para.innerHTML = "--";
    condition.innerHTML = "Weather condition";
    humidity.innerHTML = "--";
    feelsLike.innerHTML = "--";
    wind.innerHTML = "--";
  }
}

// -----------------------------------------------------------------------------
// 5. Render All Weather Data to the DOM
// -----------------------------------------------------------------------------
function renderWeatherData(weather) {
  if (!weather || !weather.current || !weather.location) return;

  const current = weather.current;
  const location = weather.location;
  const forecastDay0 = weather.forecast?.forecastday?.[0];
  const astro = forecastDay0?.astro;

  // 1. Location & Local Time Formatting
  cityName.innerHTML = `${location.name}, ${location.country}`;

  if (location.localtime) {
    // "2026-09-19 22:00"
    const dateObj = new Date(location.localtime.replace(" ", "T"));
    const dateOptions = { weekday: "long", month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit" };
    dayDateEl.innerHTML = dateObj.toLocaleDateString("en-US", dateOptions);
    localTimeEl.innerHTML = dateObj.toLocaleTimeString("en-US", timeOptions);
  }

  // 2. Weather Condition & Icon
  condition.innerHTML = current.condition.text;
  heroIconEl.innerHTML = getWeatherSvg(current.condition.text, current.is_day);

  // 3. Dynamic Atmospheric Background & Editorial Subtitle
  const themeData = determineAtmosphericTheme(weather);
  appContainer.className = `weather-app-container ${themeData.themeClass}`;
  astroPrimaryTag.innerHTML = themeData.tag;
  astroPaletteDesc.innerHTML = themeData.paletteDesc;

  // 4. Astronomical Sunset Header (Direct reference match)
  if (astro && astro.sunset) {
    // e.g. "06:31 PM" -> "6:31" and "pm"
    const sunsetParts = astro.sunset.split(" ");
    let timeStr = sunsetParts[0];
    if (timeStr.startsWith("0")) timeStr = timeStr.substring(1);
    astroMainTime.innerHTML = timeStr;
    astroMainAmpm.innerHTML = (sunsetParts[1] || "pm").toLowerCase();
  }

  // 5. Secondary Astronomy Data
  if (astro) {
    astroSunrise.innerHTML = astro.sunrise || "--";
    astroSunset.innerHTML = astro.sunset || "--";
    astroMoonPhase.innerHTML = astro.moon_phase || "--";
    astroMoonIllum.innerHTML = astro.moon_illumination ? `${astro.moon_illumination}%` : "--";
  }

  // 6. Metrics & Indicators
  const rainChance = forecastDay0?.day?.daily_chance_of_rain ?? current.chance_of_rain ?? 0;
  const snowChance = forecastDay0?.day?.daily_chance_of_snow ?? current.chance_of_snow ?? 0;

  humidity.innerHTML = `${current.humidity}%`;
  setIndicator("indicator-humidity-fill", "indicator-humidity-tick", current.humidity);

  showRain.innerHTML = `${rainChance}%`;
  setIndicator("indicator-rain-fill", "indicator-rain-tick", rainChance);

  showSnow.innerHTML = `${snowChance}%`;
  setIndicator("indicator-snow-fill", "indicator-snow-tick", snowChance);

  wind.innerHTML = `${Math.round(current.wind_kph)} km/h`;
  // Wind indicator scaled against 60 km/h
  setIndicator("indicator-wind-fill", "indicator-wind-tick", (current.wind_kph / 60) * 100);

  showUv.innerHTML = `${current.uv}`;
  // UV indicator scaled against index 11
  setIndicator("indicator-uv-fill", "indicator-uv-tick", (current.uv / 11) * 100);

  showCloud.innerHTML = `${current.cloud}%`;
  setIndicator("indicator-cloud-fill", "indicator-cloud-tick", current.cloud);

  showPressure.innerHTML = `${current.pressure_mb} hPa`;
  // Pressure indicator scaled between 970 and 1050 hPa
  const pressurePercent = ((current.pressure_mb - 970) / (1050 - 970)) * 100;
  setIndicator("indicator-pressure-fill", "indicator-pressure-tick", pressurePercent);

  // Visibility Horizontal Pill
  const visKm = current.vis_km;
  const visPercent = Math.min(100, Math.round((visKm / 10) * 100)); // 10km is standard clear visibility
  showVisVal.innerHTML = `${visKm}`;
  showVisUnit.innerHTML = `km (${visPercent}%)`;
  if (visFillBar) {
    visFillBar.style.width = `${visPercent}%`;
  }

  // 7. Update Unit-dependent Values (Temperature & Feels Like)
  updateTemperatureDisplays();

  // 8. Render Hourly Forecast
  renderHourlyForecast(weather);
}

// -----------------------------------------------------------------------------
// 6. Temperature Unit Management (°C / °F)
// -----------------------------------------------------------------------------
function setTemperatureUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  // Toggle active class on buttons
  if (unit === "C") {
    unitCBtn.classList.add("active");
    unitFBtn.classList.remove("active");
  } else {
    unitFBtn.classList.add("active");
    unitCBtn.classList.remove("active");
  }

  // Update displayed temperatures without re-fetching API
  if (cachedWeatherData) {
    updateTemperatureDisplays();
    renderHourlyForecast(cachedWeatherData);
  }
}

function updateTemperatureDisplays() {
  if (!cachedWeatherData || !cachedWeatherData.current) return;

  const current = cachedWeatherData.current;

  if (currentUnit === "C") {
    para.innerHTML = Math.round(current.temp_c);
    feelsLike.innerHTML = `${Math.round(current.feelslike_c)}°`;
    tempUnitSymbol.innerHTML = "°C";

    // Indicator calibrated from -5°C to 45°C
    const tempPercent = ((current.feelslike_c - (-5)) / (45 - (-5))) * 100;
    setIndicator("indicator-feels-fill", "indicator-feels-tick", tempPercent);
  } else {
    para.innerHTML = Math.round(current.temp_f);
    feelsLike.innerHTML = `${Math.round(current.feelslike_f)}°`;
    tempUnitSymbol.innerHTML = "°F";

    // Indicator calibrated from 20°F to 115°F
    const tempPercent = ((current.feelslike_f - 20) / (115 - 20)) * 100;
    setIndicator("indicator-feels-fill", "indicator-feels-tick", tempPercent);
  }
}

// -----------------------------------------------------------------------------
// 7. Hourly Forecast Rendering (Upcoming 7 hours seamlessly spanning midnight)
// -----------------------------------------------------------------------------
function renderHourlyForecast(weather) {
  if (!hourlyContainer || !weather.forecast?.forecastday) return;

  // Combine hours from day 0 and day 1 to handle times past midnight
  const day0Hours = weather.forecast.forecastday[0]?.hour || [];
  const day1Hours = weather.forecast.forecastday[1]?.hour || [];
  const allHours = [...day0Hours, ...day1Hours];

  const localTimeStr = weather.location.localtime; // e.g. "2026-09-19 22:00"
  const currentHour = localTimeStr ? parseInt(localTimeStr.split(" ")[1].split(":")[0], 10) : new Date().getHours();

  // Pick upcoming 7 hours starting from current hour + 1 (or current hour)
  const upcomingHours = allHours.slice(currentHour, currentHour + 7);

  let html = "";
  upcomingHours.forEach((hr) => {
    // Format hour string (e.g. "2026-09-19 23:00" -> "11 PM")
    const timeOnly = hr.time.split(" ")[1];
    const hourNum = parseInt(timeOnly.split(":")[0], 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const formattedHour = (hourNum % 12 || 12) + " " + ampm;

    const tempVal = currentUnit === "C" ? Math.round(hr.temp_c) : Math.round(hr.temp_f);
    const rainChance = hr.chance_of_rain ?? 0;
    const iconSvg = getWeatherSvg(hr.condition.text, hr.is_day);

    html += `
      <div class="hourly-item">
        <span class="hourly-time">${formattedHour}</span>
        <div class="hourly-icon-wrap" title="${hr.condition.text}">
          ${iconSvg}
        </div>
        <span class="hourly-temp">${tempVal}°</span>
        <span class="hourly-rain">${rainChance}%</span>
      </div>
    `;
  });

  hourlyContainer.innerHTML = html;
}

// -----------------------------------------------------------------------------
// 8. Initial Page Load
// Automatically fetches initial weather for Karachi so the app is immediately alive
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.querySelector("#city-input");
  if (cityInput) {
    cityInput.value = "Karachi";
  }
  // Fetch default city
  getWeather();
});
