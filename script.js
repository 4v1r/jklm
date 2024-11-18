let wordLists = {};

async function loadAvailableLists() {
    try {
        const response = await fetch('lists/available_lists.json');
        const lists = await response.json();
        const container = document.getElementById('listsContainer');
        
        lists.forEach(list => {
            const div = document.createElement('div');
            div.className = 'list-checkbox-container';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `list-${list.id}`;
            checkbox.checked = true;
            checkbox.addEventListener('change', loadAllLists);
            
            const label = document.createElement('label');
            label.htmlFor = `list-${list.id}`;
            label.textContent = list.name;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
        
        await loadAllLists();
    } catch (error) {
        console.error('Erreur lors du chargement des listes:', error);
    }
}

async function loadAllLists() {
    wordLists = {};
    const checkboxes = document.querySelectorAll('.list-checkbox-container input[type="checkbox"]');
    let totalWords = 0;
    
    for (const checkbox of checkboxes) {
        if (checkbox.checked) {
            const listId = checkbox.id.replace('list-', '');
            try {
                const response = await fetch(`lists/${listId}.txt`);
                const text = await response.text();
                const words = text.split('\n')
                    .map(word => word.trim())
                    .filter(word => word);
                wordLists[listId] = words;
                totalWords += words.length;
            } catch (error) {
                console.error(`Erreur lors du chargement de ${listId}:`, error);
            }
        }
    }
    
    document.getElementById('wordCount').textContent = `Nombre total de mots: ${totalWords}`;
}

function submitWord(action) {
    const input = action === 'add' ? document.getElementById('addWord') : document.getElementById('removeWord');
    const word = input.value.trim();
    
    if (!word) {
        document.getElementById('submitStatus').textContent = 'Veuillez entrer un mot';
        return;
    }

    const filename = action === 'add' ? '/request_add.txt' : '/request_withdraw.txt';
    
    fetch(`http://localhost:3000${filename}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: word
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('submitStatus').textContent = 
                `Mot "${word}" soumis avec succès pour ${action === 'add' ? 'ajout' : 'retrait'}`;
            input.value = '';
        } else {
            throw new Error('Erreur lors de la soumission');
        }
    })
    .catch(error => {
        document.getElementById('submitStatus').textContent = 
            `Erreur: ${error.message}`;
    });
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (body.getAttribute('data-theme') === 'light') {
        body.removeAttribute('data-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAvailableLists();
    
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        themeToggle.textContent = '☀️';
    }

    // Ajouter l'écouteur pour la touche Entrée
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                updateResults();
            }
        });
    });
});

function countSyllables(word) {
    word = word.toLowerCase();
    let count = 0;
    const vowels = 'aeiouyéèêëàâîïôûù';
    let isPreviousVowel = false;

    for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i]);
        if (isVowel && !isPreviousVowel) {
            count++;
        }
        isPreviousVowel = isVowel;
    }
    
    if (word.endsWith('e')) count--;
    return Math.max(count, 1);
}

function updateResults() {
    const startsWith = document.getElementById('startsWith').value.toLowerCase();
    const endsWith = document.getElementById('endsWith').value.toLowerCase();
    const contains = document.getElementById('contains').value.toLowerCase();
    const notContains = document.getElementById('notContains').value.toLowerCase();
    const sequence = document.getElementById('sequence').value.toLowerCase();
    const notSequence = document.getElementById('notSequence').value.toLowerCase();
    const syllablesMin = parseInt(document.getElementById('syllablesMin').value) || 0;
    const syllablesMax = parseInt(document.getElementById('syllablesMax').value) || 999;
    const lengthMin = parseInt(document.getElementById('lengthMin').value) || 0;
    const lengthMax = parseInt(document.getElementById('lengthMax').value) || 999;

    const allWords = Object.values(wordLists).flat();
    const filteredWords = allWords.filter(word => {
        word = word.trim().toLowerCase();
        if (!word) return false;

        if (startsWith && !word.startsWith(startsWith)) return false;
        if (endsWith && !word.endsWith(endsWith)) return false;
        
        if (contains) {
            const containsLetters = contains.split('').every(letter => 
                word.includes(letter));
            if (!containsLetters) return false;
        }
        
        if (notContains) {
            const hasExcludedLetters = notContains.split('').some(letter => 
                word.includes(letter));
            if (hasExcludedLetters) return false;
        }
        
        if (sequence && !word.includes(sequence)) return false;
        if (notSequence && word.includes(notSequence)) return false;

        const syllableCount = countSyllables(word);
        if (syllableCount < syllablesMin || syllableCount > syllablesMax) return false;
        
        if (word.length < lengthMin || word.length > lengthMax) return false;

        return true;
    });

    const wordsByLength = {};
    filteredWords.forEach(word => {
        const length = word.length;
        if (!wordsByLength[length]) {
            wordsByLength[length] = [];
        }
        wordsByLength[length].push(word);
    });

    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    Object.keys(wordsByLength)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach(length => {
            const group = document.createElement('div');
            group.className = 'length-group';
            
            const header = document.createElement('div');
            header.className = 'length-header';
            header.textContent = `${length} lettres (${wordsByLength[length].length} mots)`;
            group.appendChild(header);

            const wordsDiv = document.createElement('div');
            wordsDiv.className = 'results';
            wordsDiv.style.display = 'grid';
            wordsDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            wordsDiv.style.gap = '8px';

            wordsByLength[length].sort().forEach(word => {
                const wordDiv = document.createElement('div');
                wordDiv.className = 'word-item';
                wordDiv.textContent = word;
                wordsDiv.appendChild(wordDiv);
            });

            group.appendChild(wordsDiv);
            container.appendChild(group);
        });

    document.getElementById('wordCount').textContent = 
        `Mots trouvés: ${filteredWords.length}`;

    // Réinitialiser les filtres si la case n'est pas cochée
    const saveFilters = document.getElementById('saveFilters').checked;
    if (!saveFilters) {
        document.getElementById('startsWith').value = '';
        document.getElementById('endsWith').value = '';
        document.getElementById('contains').value = '';
        document.getElementById('notContains').value = '';
        document.getElementById('sequence').value = '';
        document.getElementById('notSequence').value = '';
        document.getElementById('syllablesMin').value = '';
        document.getElementById('syllablesMax').value = '';
        document.getElementById('lengthMin').value = '';
        document.getElementById('lengthMax').value = '';
    }
}
