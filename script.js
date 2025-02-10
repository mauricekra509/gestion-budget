
const API_URL = "https://64b5ebd4f3dbab5a95c777.mockapi.io/budgets";

// 🔹 Définir l'URL de l'API MockAPI
const API_URL = "https://67a9b46e6e9548e44fc482c6.mockapi.io/budgets";

// 🔹 Charger les enveloppes au démarrage
document.addEventListener("DOMContentLoaded", loadBudget);

// 🔹 Fonction pour récupérer les enveloppes depuis MockAPI
async function loadBudget() {
    const allocationFields = document.getElementById("allocationFields");
    const expenseSelect = document.getElementById("expenseEnvelope");
    allocationFields.innerHTML = "";
    expenseSelect.innerHTML = "";

    try {
        const response = await fetch(API_URL); // Récupérer les données MockAPI
        envelopes = await response.json(); // Convertir en JSON

        envelopes.forEach((env, index) => {
            allocationFields.innerHTML += `
                <div class="envelope">
                    <label>${env.name}</label>
                    <input type="number" id="alloc-${index}" value="${env.amount}" oninput="updateEnvelope(${env.id})">
                    <button onclick="deleteEnvelope(${env.id})">❌</button>
                </div>
            `;
            expenseSelect.innerHTML += `<option value="${env.id}">${env.name}</option>`;
        });

        updateChart();
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

            loadBudget();
        } else {
            alert("Fonds insuffisants.");
        }
    } catch (error) {
        console.error("Erreur lors de la dépense", error);
    }
}

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


document.addEventListener("DOMContentLoaded", loadBudget);

// 🏆 Définir un identifiant unique pour le budget
let budgetID = prompt("Entrez le nom de l'instance de budget :") || "budget_1";

let envelopes = JSON.parse(localStorage.getItem(`${budgetID}_data`)) || [];
let fixedIncome = localStorage.getItem(`${budgetID}_income`) || 0;
let totalExpenses = 0; // Suivi des dépenses
let transactions = JSON.parse(localStorage.getItem(`${budgetID}_transactions`)) || [];

document.getElementById("fixedIncome").value = fixedIncome;
document.getElementById("fixedIncome").addEventListener("input", updateFinalIncome);

function loadBudget() {
    const allocationFields = document.getElementById("allocationFields");
    const expenseSelect = document.getElementById("expenseEnvelope");
    allocationFields.innerHTML = "";
    expenseSelect.innerHTML = "";

    envelopes.forEach((env, index) => {
        allocationFields.innerHTML += `
            <div class="envelope">
                <label>${env.name}</label>
                <input type="number" id="alloc-${index}" value="${env.amount}" oninput="updateEnvelope(${index})">
                <button onclick="deleteEnvelope(${index})">❌</button>
            </div>
        `;
        expenseSelect.innerHTML += `<option value="${index}">${env.name}</option>`;
    });

    updateFinalIncome();
    updateChart();
    loadTransactions();
}

function addEnvelope() {
    const name = document.getElementById("newEnvelopeName").value.trim();
    if (!name) return alert("Veuillez entrer un nom d'enveloppe.");
    envelopes.push({ name, amount: 0 });
    saveBudget();
    loadBudget();
}

function deleteEnvelope(index) {
    envelopes.splice(index, 1);
    saveBudget();
    loadBudget();
}

function updateEnvelope(index) {
    const newAmount = parseFloat(document.getElementById(`alloc-${index}`).value) || 0;
    const totalAllocated = envelopes.reduce((sum, env) => sum + env.amount, 0) - envelopes[index].amount + newAmount;
    const finalIncome = parseFloat(document.getElementById("finalIncome").textContent);

    if (totalAllocated > finalIncome) {
        alert("La somme des enveloppes ne peut pas dépasser le revenu final.");
        document.getElementById(`alloc-${index}`).value = envelopes[index].amount;
    } else {
        envelopes[index].amount = newAmount;
        saveBudget();
        updateChart();
    }
}

function addExpense() {
    const index = document.getElementById("expenseEnvelope").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    if (isNaN(amount) || amount <= 0) return alert("Veuillez entrer un montant valide.");
    if (envelopes[index].amount >= amount) {
        envelopes[index].amount -= amount;
        totalExpenses += amount;
        addTransaction("Dépense", envelopes[index].name, amount);
        saveBudget();
        loadBudget();
    } else {
        alert("Fonds insuffisants.");
    }
}

function addTransaction(type, name, amount) {
    transactions.unshift({ type, name, amount, date: new Date().toLocaleString() });
    localStorage.setItem(`${budgetID}_transactions`, JSON.stringify(transactions));
    loadTransactions();
}

function loadTransactions() {
    const historyList = document.getElementById("transactionHistory");
    historyList.innerHTML = transactions.map(t => 
        `<li>${t.date} - ${t.type} ${t.amount}€ pour ${t.name}</li>`
    ).join('');
}

function updateFinalIncome() {
    fixedIncome = parseFloat(document.getElementById("fixedIncome").value) || 0;
    localStorage.setItem(`${budgetID}_income`, fixedIncome);
    document.getElementById("finalIncome").textContent = fixedIncome - totalExpenses;
}

function saveBudget() {
    localStorage.setItem(`${budgetID}_data`, JSON.stringify(envelopes));
}

function updateChart() {
    const canvas = document.getElementById("budgetChart");
    canvas.style.width = "100%";
    canvas.style.height = "400px";

    const ctx = canvas.getContext("2d");
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
                        autoSkip: false,  // Afficher toutes les étiquettes
                        maxRotation: 30,  // Incliner légèrement au lieu de 45°
                        minRotation: 30,
                        font: {
                            size: 10 // Réduire la taille du texte
                        }
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
        
    });
}
