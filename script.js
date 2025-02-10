// 🔹 Définir l'URL de l'API MockAPI
const API_URL = "https://67a9b46e6e9548e44fc482c6.mockapi.io/budgets";

// 🔹 Charger les enveloppes au démarrage
document.addEventListener("DOMContentLoaded", loadBudget);

// 🔹 Fonction pour récupérer les enveloppes depuis MockAPI
async function loadBudget() {
    const allocationFields = document.getElementById("allocationFields");
    const expenseSelect = document.getElementById("expenseEnvelope");

    allocationFields.innerHTML = "";  // 🔹 Vider les enveloppes avant d'ajouter
    expenseSelect.innerHTML = "";

    try {
        const response = await fetch(API_URL);
        envelopes = await response.json();

        // 🔹 Vérification pour éviter les doublons
        const existingIds = new Set();
        envelopes.forEach((env, index) => {
            if (!existingIds.has(env.id)) {
                existingIds.add(env.id);
                
                allocationFields.innerHTML += `
                    <div class="envelope">
                        <label>${env.name}</label>
                        <input type="number" id="alloc-${index}" value="${env.amount}" oninput="updateEnvelope(${env.id})">
                        <button onclick="deleteEnvelope(${env.id})">❌</button>
                    </div>
                `;
                expenseSelect.innerHTML += `<option value="${env.id}">${env.name}</option>`;
            }
        });

        updateFinalIncome(); // Mettre à jour le revenu final
    } catch (error) {
        console.error("Erreur lors du chargement des enveloppes", error);
    }
}


// 🔹 Fonction pour ajouter une nouvelle enveloppe
async function addEnvelope() {
    const name = document.getElementById("newEnvelopeName").value.trim();
    if (!name) return alert("Veuillez entrer un nom d'enveloppe.");
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, amount: 0, category: "Autre" })
        });

        const newEnvelope = await response.json();
        envelopes.push(newEnvelope);
        loadBudget();
    } catch (error) {
        console.error("Erreur lors de l'ajout", error);
    }
}

// 🔹 Fonction pour supprimer une enveloppe
async function deleteEnvelope(id) {
    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        envelopes = envelopes.filter(env => env.id !== id);
        loadBudget();
    } catch (error) {
        console.error("Erreur lors de la suppression", error);
    }
}

// 🔹 Fonction pour ajouter une dépense
async function addExpense() {
    const id = document.getElementById("expenseEnvelope").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);

    if (isNaN(amount) || amount <= 0) return alert("Veuillez entrer un montant valide.");

    try {
        const response = await fetch(`${API_URL}/${id}`);
        let envelope = await response.json();

        if (envelope.amount >= amount) {
            envelope.amount -= amount;
            
            await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(envelope)
            });

            loadBudget();  // 🔹 Recharger l'affichage après modification
        } else {
            alert("Fonds insuffisants.");
        }
    } catch (error) {
        console.error("Erreur lors de la dépense", error);
    }
}


async function updateFinalIncome() {
    const fixedIncome = parseFloat(document.getElementById("fixedIncome").value) || 0;
    
    try {
        const response = await fetch(API_URL);
        const envelopes = await response.json();

        const totalAllocated = envelopes.reduce((sum, env) => sum + env.amount, 0);
        const finalIncome = fixedIncome - totalAllocated;

        document.getElementById("finalIncome").textContent = finalIncome + " €";
    } catch (error) {
        console.error("Erreur lors du calcul du revenu final :", error);
    }
}

// Assurez-vous que l'événement "input" est bien attaché au champ de revenu fixe
document.getElementById("fixedIncome").addEventListener("input", updateFinalIncome);

// 🔹 Fonction pour mettre à jour le graphique
function updateChart() {
    const ctx = document.getElementById("budgetChart").getContext("2d");
    const labels = envelopes.map(env => env.name);
    const data = envelopes.map(env => env.amount);

    if (window.budgetChartInstance) {
        window.budgetChartInstance.destroy();
    }

    window.budgetChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Solde (€)",
                data: data,
                backgroundColor: "#007BFF"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 30,
                        minRotation: 30,
                        font: { size: 10 }
                    }
                },
                y: { beginAtZero: true }
            }
        }
    });
}
