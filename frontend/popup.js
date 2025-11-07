// Popup script for the beautiful AI Multi-Agent Dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Agent buttons
    const agent1Btn = document.getElementById('agent1Btn');
    const agent2Btn = document.getElementById('agent2Btn');
    const agent3Btn = document.getElementById('agent3Btn');
    const agent4Btn = document.getElementById('agent4Btn');
    const testAllBtn = document.getElementById('testAllBtn');
    
    // Status elements
    const agent1Status = document.getElementById('agent1Status');
    const agent2Status = document.getElementById('agent2Status');
    const agent3Status = document.getElementById('agent3Status');
    const agent4Status = document.getElementById('agent4Status');
    const testStatus = document.getElementById('testStatus');
    
    // Test text area
    const testText = document.getElementById('testText');

    // Agent URLs
    const AGENT_URLS = {
        agent1: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent1-linguistic',
        agent2: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent2-evidence',
        agent3: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/vishwas-agent3-visual', // Updated URL
        agent4: 'https://us-central1-okqyyqqyqyyq.cloudfunctions.net/clean-agent4-synthesizer'
    };

    // Add event listeners to agent buttons
    agent1Btn.addEventListener('click', () => analyzeAgent('agent1', agent1Status));
    agent2Btn.addEventListener('click', () => analyzeAgent('agent2', agent2Status));
    agent3Btn.addEventListener('click', () => analyzeAgent('agent3', agent3Status));
    agent4Btn.addEventListener('click', () => analyzeAgent('agent4', agent4Status));
    testAllBtn.addEventListener('click', analyzeAllAgents);

    // Function to analyze a specific agent
    async function analyzeAgent(agentId, statusElement) {
        const text = testText.value.trim();
        
        if (!text) {
            showStatus(statusElement, 'Please enter some text to analyze', 'error');
            return;
        }

        // Disable button and show loading state
        const button = document.querySelector(`#${agentId}Btn`);
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Analyzing...';

        try {
            showStatus(statusElement, `Sending request to ${agentId}...`, 'success');
            
            // Call the agent
            const response = await fetch(AGENT_URLS[agentId], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            showStatus(statusElement, `✅ ${agentId} analysis completed! Check console for details.`, 'success');
            console.log(`${agentId} result:`, result);
            
        } catch (error) {
            console.error(`${agentId} analysis failed:`, error);
            showStatus(statusElement, `❌ ${agentId} analysis failed: ${error.message}`, 'error');
        } finally {
            // Re-enable button
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    // Function to analyze all agents
    async function analyzeAllAgents() {
        const text = testText.value.trim();
        
        if (!text) {
            showStatus(testStatus, 'Please enter some text to analyze', 'error');
            return;
        }

        // Disable all buttons
        const buttons = [agent1Btn, agent2Btn, agent3Btn, agent4Btn, testAllBtn];
        const originalTexts = buttons.map(btn => btn.textContent);
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Analyzing...';
        });

        showStatus(testStatus, 'Starting multi-agent analysis...', 'success');

        try {
            // Call all agents in parallel
            const agentPromises = Object.keys(AGENT_URLS).map(agentId => 
                fetch(AGENT_URLS[agentId], {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => ({ agentId, result }))
                .catch(error => ({ agentId, error: error.message }))
            );

            const results = await Promise.all(agentPromises);
            
            results.forEach(({ agentId, result, error }) => {
                const statusElement = document.getElementById(`${agentId}Status`);
                if (error) {
                    showStatus(statusElement, `❌ ${agentId} failed: ${error}`, 'error');
                } else {
                    showStatus(statusElement, `✅ ${agentId} completed successfully`, 'success');
                    console.log(`${agentId} result:`, result);
                }
            });
            
            showStatus(testStatus, '✅ Multi-agent analysis completed! Check console for details.', 'success');
            
        } catch (error) {
            console.error('Multi-agent analysis failed:', error);
            showStatus(testStatus, `❌ Multi-agent analysis failed: ${error.message}`, 'error');
        } finally {
            // Re-enable all buttons
            buttons.forEach((btn, index) => {
                btn.disabled = false;
                btn.textContent = originalTexts[index];
            });
        }
    }

    // Helper function to show status messages with animation
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status ${type}`;
        element.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    console.log('Popup: AI Multi-Agent Dashboard loaded');
});