 // Get references to DOM elements
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const searchIcon = document.getElementById('searchIcon');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const definitionCard = document.getElementById('definitionCard');
        const wordTitle = document.getElementById('wordTitle');
        const definitionContent = document.getElementById('definitionContent');
        const wikipediaLink = document.getElementById('wikipediaLink');
        const errorMessageDiv = document.getElementById('errorMessage');
        const errorTextSpan = document.getElementById('errorText');
        const initialPromptDiv = document.getElementById('initialPrompt');
        const recentSearchesCard = document.getElementById('recentSearchesCard');
        const recentSearchesList = document.getElementById('recentSearchesList');
        const messageBox = document.getElementById('messageBox');
        const messageBoxText = document.getElementById('messageBoxText');
        const closeMessageBoxButton = document.getElementById('closeMessageBox');

        // Set the current year in the footer
        document.getElementById('currentYear').textContent = new Date().getFullYear();

        // Focus on the search input when the page loads
        window.onload = function() {
            searchInput.focus();
            loadRecentSearches(); // Load recent searches on page load
        };

        // Function to show a custom message box
        function showMessageBox(text, type = 'info') {
            messageBoxText.textContent = text;
            messageBox.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform visible ${
                type === 'error' ? 'bg-red-600 text-white' :
                type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
            } flex items-center justify-between space-x-4`;

            // Automatically hide the message after some time for non-error messages
            if (type !== 'error') {
                setTimeout(() => {
                    hideMessageBox();
                }, 3000);
            }
        }

        // Function to hide the custom message box
        function hideMessageBox() {
            messageBox.classList.remove('visible');
            setTimeout(() => {
                messageBox.className = 'fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between space-x-4';
            }, 300); // Allow transition to complete before resetting classes
        }

        // Event listener for closing the message box
        closeMessageBoxButton.addEventListener('click', hideMessageBox);

        // Array to store recent searches (can be extended with localStorage for persistence)
        let recentSearches = [];
        const MAX_RECENT_SEARCHES = 5;

        // Function to load recent searches (placeholder for localStorage)
        function loadRecentSearches() {
            // For now, it starts empty. In a real app, you'd load from localStorage
            // const storedSearches = localStorage.getItem('dictisense_recent_searches');
            // if (storedSearches) {
            //     recentSearches = JSON.parse(storedSearches);
            // }
            renderRecentSearches();
        }

        // Function to add a word to recent searches
        function addRecentSearch(word) {
            const normalizedWord = word.trim().toLowerCase();
            // Remove if already exists to move it to the top
            recentSearches = recentSearches.filter(item => item.toLowerCase() !== normalizedWord);
            recentSearches.unshift(word); // Add to the beginning
            if (recentSearches.length > MAX_RECENT_SEARCHES) {
                recentSearches.pop(); // Remove the oldest if over limit
            }
            // localStorage.setItem('dictisense_recent_searches', JSON.stringify(recentSearches));
            renderRecentSearches();
        }

        // Function to render recent searches in the UI
        function renderRecentSearches() {
            recentSearchesList.innerHTML = ''; // Clear existing list
            if (recentSearches.length === 0) {
                const li = document.createElement('li');
                li.className = 'text-gray-500';
                li.textContent = 'No recent searches yet.';
                recentSearchesList.appendChild(li);
                recentSearchesCard.classList.remove('hidden'); // Ensure card is visible even if empty
                return;
            }

            recentSearches.forEach(word => {
                const li = document.createElement('li');
                li.className = 'py-1 px-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors duration-150 flex items-center justify-between';
                li.innerHTML = `
                    <span class="truncate pr-2">${word}</span>
                    <button class="text-purple-500 hover:text-purple-700 text-sm font-semibold flex-shrink-0" data-word="${word}">
                        Search
                    </button>
                `;
                // Add event listener to the "Search" button within recent searches
                li.querySelector('button').addEventListener('click', (e) => {
                    const clickedWord = e.target.dataset.word;
                    searchInput.value = clickedWord;
                    fetchDefinition(clickedWord);
                });
                recentSearchesList.appendChild(li);
            });
            recentSearchesCard.classList.remove('hidden'); // Ensure card is visible
        }

        // Asynchronous function to fetch definition/summary from Wikipedia API
        async function fetchDefinition(word) {
            if (!word.trim()) {
                showMessageBox('Please enter a word or concept.', 'warning');
                return;
            }

            // Show loading spinner, hide search icon
            searchIcon.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            searchButton.disabled = true; // Disable button during search

            // Hide previous results and error messages
            definitionCard.classList.add('hidden');
            errorMessageDiv.classList.add('hidden');
            initialPromptDiv.classList.add('hidden'); // Always hide initial prompt when searching

            try {
                // Wikipedia API URL to get the first 3 sentences of the extract as plain text
                const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=3&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(word)}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                const page = pages[pageId];

                if (page && page.extract && page.extract.trim() !== '') {
                    wordTitle.textContent = page.title;
                    definitionContent.textContent = page.extract; // Use textContent for plain text
                    wikipediaLink.href = `https://en.wikipedia.org/?curid=${page.pageid}`;
                    definitionCard.classList.remove('hidden'); // Show definition card
                    addRecentSearch(page.title); // Add the *actual* page title to recent searches
                } else {
                    // Page might exist but have no extract (e.g., disambiguation, very short stubs) or not found
                    showMessageBox(`No detailed information found for "${word}". Please try a different word or concept.`, 'info');
                    initialPromptDiv.classList.remove('hidden'); // Show initial prompt
                }
            } catch (e) {
                console.error("Error fetching data:", e);
                errorTextSpan.textContent = 'Failed to fetch information. Please check your internet connection or try again later.';
                errorMessageDiv.classList.remove('hidden'); // Show error message
                showMessageBox('Failed to fetch information. Please try again later.', 'error');
                initialPromptDiv.classList.remove('hidden'); // Show initial prompt on error
            } finally {
                // Hide loading spinner, show search icon
                loadingSpinner.classList.add('hidden');
                searchIcon.classList.remove('hidden');
                searchButton.disabled = false; // Enable button
            }
        }

        // Handle form submission
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission (page reload)
            const query = searchInput.value;
            fetchDefinition(query);
        });