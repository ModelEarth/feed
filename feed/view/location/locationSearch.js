document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('autocomplete-input');
    const resultsContainer = document.getElementById('autocomplete-results');
    const loading = document.getElementById('loading');
  
    let items = [];
  
    async function fetchLocations(inputValue) {
      if (!inputValue) return;
      loading.style.display = 'block';
      try {
        const response = await fetch(`https://autocomplete.search.hereapi.com/v1/autocomplete?apiKey=14B6Yr62CTa_mKKoYViJQClxjjA32S6pL4Ir2ehCMcY&q=${inputValue}&maxresults=5`);
        const data = await response.json();
        items = data.items.map(item => ({
          id: item.id,
          title: item.title,
          address: item.address.label
        }));
        loading.style.display = 'none';
        renderResults();
      } catch (error) {
        console.error('Error fetching data:', error);
        loading.style.display = 'none';
        items = [];
        renderResults();
      }
    }
  
    function renderResults() {
      resultsContainer.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item.title;
        li.className = 'autocomplete-item';
        li.addEventListener('click', () => {
          input.value = item.title;
          globalAddress = item.address;
          console.log('Selected item', item);
          displayRequests(1, 1, item.address);
          resultsContainer.innerHTML = '';
        });
        resultsContainer.appendChild(li);
      });
    }
  
    input.addEventListener('input', function () {
      const value = input.value;
      fetchLocations(value);
    });
  });
  
  var globalAddress = "";
  
  function updateGlobalAddress() {
    var inputField = document.getElementById("autocomplete-input");
    globalAddress = inputField.value;
    console.log("Global Address Updated: " + globalAddress);
    displayRequests(1, 1);
  }
 function addressLookup()
  {
    let url = `https://seeclickfix.com/api/v2/issues?search[place_name]=${globalAddress}`;
 
    axios.get(url)
    .then((data) => {
      const results = data.data.issues;

         if (results.length > 0) {
        // Store latitude and longitude of the first item in localStorage
        localStorage.setItem('latitude', results[0].lat);
        localStorage.setItem('longitude', results[0].lng);
         }
      });
    
   }
  
  const requestsDiv = document.getElementById('requests');
  
  function displayRequests(latitude, longitude) {
  let url;
  if (!globalAddress) {
    url = `https://seeclickfix.com/api/v2/issues?lat=${latitude}&lng=${longitude}&zoom=8&per_page=10`;
  } else {
    url = `https://seeclickfix.com/api/v2/issues?search[place_name]=${globalAddress}`;
  }

   
  requestsDiv.innerHTML = ""; 
  
  axios.get(url)
    .then((data) => {
      const results = data.data.issues;

         if (results.length > 0) {
        // Store latitude and longitude of the first item in localStorage
        localStorage.setItem('latitude', results[0].lat);
        localStorage.setItem('longitude', results[0].lng);
         }
      results.forEach(item => {
        const introDiv = document.createElement('div');
        introDiv.innerHTML = `
              <br><hr><h3>${item.summary}</h3>
              ${item.description}<br>
              ${item.address}<br>
              <a href="${item.html_url}">View Details</a><br><br>
           `;
        requestsDiv.appendChild(introDiv);
  
        Object.keys(item).forEach(key => {
          if (item[key] !== null) {
            const requestDiv = document.createElement('div');
            requestDiv.innerHTML = `<b>${key}</b>&nbsp; ${item[key]}`;
            requestsDiv.appendChild(requestDiv);
          }
        });
      });
    })
    .catch((error) => console.error(error));
  }
  
