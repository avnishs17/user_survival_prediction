// Enhanced interactions for Titanic Survival Predictor

document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to results
    const form = document.getElementById('predictionForm');
    const resultSection = document.querySelector('.prediction-result');
    
    // Prevent default form submission and handle with AJAX
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitFormAjax();
    });

    // Add input validation and helpful messages
    const ageInput = document.getElementById('Age');
    const fareInput = document.getElementById('Fare');
    const familySizeInput = document.getElementById('Familysize');
    
    // Age validation
    ageInput.addEventListener('input', function() {
        const age = parseFloat(this.value);
        const helperText = this.nextElementSibling;
        
        if (age && (age < 0 || age > 100)) {
            helperText.textContent = 'Please enter a realistic age (0-100)';
            helperText.style.color = '#ef4444';
        } else {
            helperText.textContent = 'Enter age in years';
            helperText.style.color = '#64748b';
        }
    });

    // Fare validation with class guidance
    fareInput.addEventListener('input', function() {
        const fare = parseFloat(this.value);
        const pclass = document.getElementById('Pclass').value;
        const helperText = document.getElementById('fareGuidance');
        
        if (fare && pclass) {
            const isRealistic = checkFareRealism(fare, parseInt(pclass));
            if (!isRealistic) {
                helperText.style.color = '#ef4444';
                helperText.textContent = 'This fare seems unusual for the selected class';
            } else {
                helperText.style.color = '#10b981';
                helperText.textContent = 'Fare looks realistic for this class';
            }
        }
    });

    // Family size validation
    familySizeInput.addEventListener('input', function() {
        const size = parseInt(this.value);
        const helperText = this.nextElementSibling;
        
        if (size && size > 10) {
            helperText.textContent = 'Large family! This was rare on the Titanic';
            helperText.style.color = '#f59e0b';
        } else {
            helperText.textContent = 'Total family members aboard';
            helperText.style.color = '#64748b';
        }
    });

    // Auto-update traveling status based on family size
    familySizeInput.addEventListener('input', function() {
        const size = parseInt(this.value);
        const aloneRadios = document.querySelectorAll('input[name="Isalone"]');
        
        if (size === 1) {
            aloneRadios[0].checked = true; // Traveling alone
        } else if (size > 1) {
            aloneRadios[1].checked = true; // With family/friends
        }
    });

    // Add tooltips for complex fields
    addTooltips();
});

function submitFormAjax() {
    const form = document.getElementById('predictionForm');
    const button = document.querySelector('.btn-predict');
    const resultSection = document.querySelector('.prediction-result');
    
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    // Hide previous results
    resultSection.classList.remove('show');
    
    // Collect form data
    const formData = new FormData(form);
    
    // Make AJAX request
    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        button.classList.remove('loading');
        button.disabled = false;
        
        if (data.error) {
            showError(data.error);
        } else {
            showResult(data.prediction_text, data.drift_detected);
        }
    })
    .catch(error => {
        // Reset button state
        button.classList.remove('loading');
        button.disabled = false;
        showError('Network error occurred. Please try again.');
        console.error('Error:', error);
    });
}

function showResult(prediction_text, drift_detected = false) {
    const resultSection = document.querySelector('.prediction-result');
    const isSurvived = prediction_text.includes('Survived');
    
    const driftWarning = drift_detected ? 
        `<div class="drift-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Data drift detected - prediction may be less reliable</span>
        </div>` : '';
    
    const resultHTML = `
        ${driftWarning}
        <div class="result-content">
            <div class="result-icon ${isSurvived ? 'survived' : 'not-survived'}">
                <i class="fas fa-${isSurvived ? 'heart' : 'anchor'}"></i>
            </div>
            <h3 class="result-title ${isSurvived ? 'survived' : 'not-survived'}">
                ${isSurvived ? 'Congratulations!' : 'A Tragic Fate'}
            </h3>
            <p class="result-text">${prediction_text}</p>
            <div class="survival-message">
                <p>${isSurvived ? 'You would have made it to safety! 🛟' : 'Your journey would have ended with the ship 🌊'}</p>
            </div>
        </div>
        <button class="btn-reset" onclick="resetForm()">
            <i class="fas fa-redo"></i> Try Different Scenario
        </button>
    `;
    
    resultSection.innerHTML = resultHTML;
    resultSection.classList.add('show');
    
    // Smooth scroll to results with a slight delay for animation
    setTimeout(() => {
        resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 200);
}

function showError(error) {
    const resultSection = document.querySelector('.prediction-result');
    const errorHTML = `
        <div class="result-content">
            <div class="result-icon not-survived">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3 class="result-title not-survived">Error</h3>
            <p class="result-text">An error occurred: ${error}</p>
            <div class="survival-message">
                <p>Please check your inputs and try again</p>
            </div>
        </div>
        <button class="btn-reset" onclick="resetForm()">
            <i class="fas fa-redo"></i> Try Again
        </button>
    `;
    
    resultSection.innerHTML = errorHTML;
    resultSection.classList.add('show');
    
    // Scroll to error
    setTimeout(() => {
        resultSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 200);
}

function resetForm() {
    const form = document.getElementById('predictionForm');
    const resultSection = document.querySelector('.prediction-result');
    
    form.reset();
    resultSection.classList.remove('show');
    
    // Clear result content after animation
    setTimeout(() => {
        resultSection.innerHTML = '';
    }, 500);
    
    // Scroll back to form top
    document.querySelector('.card-header').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

function checkFareRealism(fare, pclass) {
    const fareRanges = {
        1: { min: 25, max: 500 },   // First class
        2: { min: 10, max: 75 },    // Second class  
        3: { min: 3, max: 25 }      // Third class
    };
    
    const range = fareRanges[pclass];
    return fare >= range.min && fare <= range.max;
}

function addTooltips() {
    // Add hover tooltips for better UX
    const tooltipData = {
        'Title': 'Social title affects survival probability significantly',
        'Pclass': 'First class passengers had higher survival rates',
        'Embarked': 'Port of embarkation influenced passenger demographics'
    };
    
    Object.keys(tooltipData).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.title = tooltipData[fieldId];
        }
    });
}

// Add some Easter eggs for fun
function addEasterEggs() {
    let clickCount = 0;
    const shipIcon = document.querySelector('.ship-icon');
    
    if (shipIcon) {
        shipIcon.addEventListener('click', function() {
            clickCount++;
            if (clickCount === 5) {
                this.textContent = '🛟';
                setTimeout(() => {
                    this.textContent = '🚢';
                    clickCount = 0;
                }, 2000);
            }
        });
    }
}

// Initialize easter eggs
document.addEventListener('DOMContentLoaded', addEasterEggs);
