const API_BASE_URL = "https://expense-tracker-abe2.onrender.com";
function apiUrl(url) {
    return url.startsWith("http")
        ? url
        : `${API_BASE_URL}${url}`;
}
// ==============================
// CSRF PROTECTION
// ==============================

async function getCsrfToken() {

    const response =
    await fetch(apiUrl("/api/auth/csrf"));

    if (!response.ok) {
        throw new Error("Unable to get CSRF token");
    }

    const data =
        await response.json();

    return data.token;
}


async function secureFetch(url, options = {}) {

    const token =
        await getCsrfToken();

    const headers =
        options.headers || {};

    headers["X-XSRF-TOKEN"] =
        token;

    return fetch(apiUrl(url), {
    ...options,
    headers: headers
});
}
// ==============================
// CURRENT USER
// ==============================

let USER_ID = null;
let loggedInUser = null;
let transactions = [];


// ==============================
// INITIALIZE DASHBOARD
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        // Get the currently authenticated user
        const response =
           await fetch(apiUrl("/api/auth/me"));

        // User is not logged in
        if (!response.ok) {

            window.location.replace("login.html");
            return;
        }


        // Get user information
        loggedInUser =
            await response.json();

        USER_ID =
            loggedInUser.id;


        // Display username
        const userName =
            document.getElementById("userName");

        if (userName) {

            userName.textContent =
                loggedInUser.name;
        }


        // Load dashboard data
        await loadTransactions();
        await loadCategories();
        await loadBudget();

        // Set today's date
        const dateInput =
            document.getElementById("date");

        if (dateInput) {

            dateInput.value =
                new Date()
                    .toISOString()
                    .split("T")[0];
        }


    }  catch (error) {
    console.error("DASHBOARD INITIALIZATION ERROR:", error);
}

});


// ==============================
// LOAD TRANSACTIONS
// ==============================

async function loadTransactions() {

    try {

        const response = await fetch(
    apiUrl("/api/transactions")
);

        if (!response.ok) {
            throw new Error("Failed to load transactions");
        }

        transactions = await response.json();

        displayTransactions(transactions);
updateSummary(transactions);
updateExpenseChart(transactions);

    } catch (error) {

        console.error("Error:", error);

    }
}


// ==============================
// DISPLAY TRANSACTIONS
// ==============================

function displayTransactions(transactions) {

    const transactionList =
        document.getElementById("transactionList");

    transactionList.innerHTML = "";

    if (transactions.length === 0) {

        transactionList.innerHTML =
            "<p class='empty-message'>No transactions yet.</p>";

        return;
    }


    transactions.forEach(transaction => {

        const div = document.createElement("div");

        div.className = "transaction";


        const sign =
            transaction.type === "EXPENSE"
                ? "-"
                : "+";


        const amountClass =
            transaction.type === "EXPENSE"
                ? "amount-expense"
                : "amount-income";


        const typeClass =
            transaction.type === "EXPENSE"
                ? "expense-label"
                : "income-label";


        // Main transaction info
        const transactionInfo =
            document.createElement("div");

        transactionInfo.className = "transaction-info";


        const title =
            document.createElement("h4");

        title.textContent =
            transaction.description || "No description";


        const details =
            document.createElement("p");

        details.textContent =
            `${transaction.category.name} • ${transaction.transactionDate}`;


        const typeLabel =
            document.createElement("span");

        typeLabel.className = typeClass;

        typeLabel.textContent =
            transaction.type;


        transactionInfo.appendChild(title);
        transactionInfo.appendChild(details);
        transactionInfo.appendChild(typeLabel);


        // Transaction actions
        const transactionActions =
            document.createElement("div");

        transactionActions.className =
            "transaction-actions";


        const amount =
            document.createElement("span");

        amount.className = amountClass;

        amount.textContent =
            `${sign} ₹${transaction.amount.toFixed(2)}`;


        const editButton =
            document.createElement("button");

        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editTransaction(transaction.id);
        });


        const deleteButton =
            document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });


        transactionActions.appendChild(amount);
        transactionActions.appendChild(editButton);
        transactionActions.appendChild(deleteButton);


        // Build complete transaction card
        div.appendChild(transactionInfo);
        div.appendChild(transactionActions);

        transactionList.appendChild(div);

    });
}

// ==============================
// UPDATE SUMMARY
// ==============================

function updateSummary(transactions) {

    let income = 0;
    let expenses = 0;


    transactions.forEach(transaction => {

        if (transaction.type === "INCOME") {

            income += transaction.amount;

        } else {

            expenses += transaction.amount;

        }

    });


    const balance = income - expenses;


    document.getElementById("income").textContent =
        `₹${income.toFixed(2)}`;

    document.getElementById("expenses").textContent =
        `₹${expenses.toFixed(2)}`;

    document.getElementById("balance").textContent =
        `₹${balance.toFixed(2)}`;
        // Update expense breakdown
updateExpenseBreakdown(transactions);
}


// ==============================
// LOAD CATEGORIES
// ==============================

async function loadCategories() {

    try {

        const response =
            await fetch(apiUrl("/api/categories"));

        const categories =
            await response.json();


        const categorySelect =
            document.getElementById("category");


        categories.forEach(category => {

            const option =
                document.createElement("option");

            option.value = category.id;

            option.textContent = category.name;

            categorySelect.appendChild(option);

        });

    } catch (error) {

        console.error(
            "Error loading categories:",
            error
        );

    }
}
// ==============================
// ADD TRANSACTION
// ==============================

document
    .getElementById("transactionForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const amount =
            parseFloat(document.getElementById("amount").value);

        const categoryId =
            parseInt(document.getElementById("category").value);

        const type =
            document.getElementById("type").value;

        const description =
            document.getElementById("description").value;

        const transactionDate =
            document.getElementById("date").value;


        if (!categoryId) {
            alert("Please select a category.");
            return;
        }


        const transaction = {

            user: {
                id: USER_ID
            },

            category: {
                id: categoryId
            },

            amount: amount,

            type: type,

            description: description,

            transactionDate: transactionDate
        };


        try {

            const response = await secureFetch("/api/transactions", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(transaction)
                }
            );


            if (!response.ok) {
                throw new Error(
                    "Failed to add transaction"
                );
            }


            alert("Transaction added successfully!");


            document
                .getElementById("transactionForm")
                .reset();


            document.getElementById("date").value =
                new Date().toISOString().split("T")[0];


            loadTransactions();


        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while adding the transaction."
            );

        }

    });
    // ==============================
// DELETE TRANSACTION
// ==============================

async function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await secureFetch(`/api/transactions/${id}`, {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete transaction");
        }

        alert("Transaction deleted successfully!");

        // Refresh dashboard
        loadTransactions();

    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong while deleting the transaction."
        );
    }
}
// ==============================
// EDIT TRANSACTION
// ==============================

async function editTransaction(id) {

    try {

        // Get current user's transactions
        const response =await fetch(
    apiUrl("/api/transactions")
);

        if (!response.ok) {
            throw new Error(
                "Failed to load transactions"
            );
        }

        const transactions =
            await response.json();

        // Find the transaction we want to edit
        const transaction =
            transactions.find(
                t => t.id === id
            );

        if (!transaction) {
            alert("Transaction not found.");
            return;
        }

        // Ask user for new values
        const newAmount = prompt(
            "Enter new amount:",
            transaction.amount
        );

        if (newAmount === null) {
            return;
        }

        const parsedAmount =
            parseFloat(newAmount);

        if (
            isNaN(parsedAmount) ||
            parsedAmount <= 0
        ) {
            alert("Please enter a valid amount.");
            return;
        }

        const newDescription = prompt(
            "Enter new description:",
            transaction.description || ""
        );

        if (newDescription === null) {
            return;
        }

        // Create updated transaction
        const updatedTransaction = {

            category: {
                id: transaction.category.id
            },

            amount: parsedAmount,

            type: transaction.type,

            description: newDescription,

            transactionDate:
                transaction.transactionDate
        };

        // Send PUT request
        const updateResponse =
            await secureFetch(`/api/transactions/${id}`, {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        updatedTransaction
                    )
                }
            );

        if (!updateResponse.ok) {

            const error =
                await updateResponse.text();

            throw new Error(
                error ||
                "Failed to update transaction"
            );
        }

        alert(
            "Transaction updated successfully!"
        );

        // Refresh dashboard
        await loadTransactions();

    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong while updating the transaction."
        );
    }
}
// ==============================
// EXPENSE BREAKDOWN
// ==============================

function updateExpenseBreakdown(transactions) {

    const breakdown =
        document.getElementById("expenseBreakdown");

    const categoryTotals = {};


    transactions.forEach(transaction => {

        if (transaction.type !== "EXPENSE") {
            return;
        }

        const categoryName =
            transaction.category.name;

        if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = 0;
        }

        categoryTotals[categoryName] +=
            transaction.amount;
    });


    breakdown.innerHTML = "";


    if (Object.keys(categoryTotals).length === 0) {

        breakdown.innerHTML =
            "<p>No expenses yet.</p>";

        return;
    }


    for (const category in categoryTotals) {

        const amount =
            categoryTotals[category];

        const item =
            document.createElement("p");

        item.textContent =
            `${category} — ₹${amount.toFixed(2)}`;

        breakdown.appendChild(item);
    }
}
// ==============================
// EXPENSE CHART
// ==============================

let expenseChart = null;

function updateExpenseChart(transactions) {

    const categoryTotals = {};

    transactions.forEach(transaction => {

        if (transaction.type !== "EXPENSE") {
            return;
        }

        const categoryName =
            transaction.category.name;

        if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = 0;
        }

        categoryTotals[categoryName] +=
            transaction.amount;
    });


    const labels =
        Object.keys(categoryTotals);

    const data =
        Object.values(categoryTotals);


    const canvas =
        document.getElementById("expenseChart");


    if (!canvas) {
        return;
    }


    // Destroy old chart before creating a new one
    if (expenseChart) {
        expenseChart.destroy();
    }


    if (labels.length === 0) {
        return;
    }


    expenseChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: labels,

            datasets: [{
                data: data
            }]
        },

        options: {

            responsive: true,

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });
}

// ==============================
// LOGOUT
// ==============================

async function logout() {

    try {

        await secureFetch("/api/auth/logout", {
                method: "POST"
            }
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        window.location.replace("login.html");

    }
}
// ==============================
// MONTHLY BUDGET
// ==============================

async function loadBudget() {

    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {

        const response = await fetch(
    apiUrl(`/api/budgets/${year}/${month}`)
);

        if (response.status === 404) {
            updateBudgetDisplay(0);
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load budget");
        }

        const budget = await response.json();

        document.getElementById("budgetAmount").value =
            budget.amount;

        updateBudgetDisplay(
            Number(budget.amount)
        );

    } catch (error) {

        console.error("Budget loading error:", error);

    }
}


// SAVE / UPDATE BUDGET
async function saveBudget() {

    const amountInput =
        document.getElementById("budgetAmount");

    const amount =
        Number(amountInput.value);

    if (!amount || amount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    try {

        const response = await secureFetch("/api/budgets", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    month: month,
                    year: year,
                    amount: amount
                })
            }
        );

        if (!response.ok) {
            throw new Error("Failed to save budget");
        }

        const budget = await response.json();

        updateBudgetDisplay(
            Number(budget.amount)
        );

        alert("Budget saved successfully!");

    } catch (error) {

        console.error("Budget save error:", error);

        alert("Failed to save budget.");
    }
}


// UPDATE BUDGET UI
function updateBudgetDisplay(budgetAmount) {

    const budgetTotal =
        document.getElementById("budgetTotal");

    const budgetSpent =
        document.getElementById("budgetSpent");

    const budgetRemaining =
        document.getElementById("budgetRemaining");

    const budgetProgress =
        document.getElementById("budgetProgress");

    const budgetPercentage =
        document.getElementById("budgetPercentage");


    // Get current expenses
    let spent = 0;

if (typeof transactions !== "undefined") {

    const now = new Date();

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    spent = transactions
        .filter(transaction => {

            if (transaction.type !== "EXPENSE") {
                return false;
            }

            const transactionDate =
                new Date(transaction.transactionDate);

            return (
                transactionDate.getMonth() + 1 === currentMonth &&
                transactionDate.getFullYear() === currentYear
            );

        })
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );
}


    const remaining =
        budgetAmount - spent;

    let percentage = 0;

    if (budgetAmount > 0) {
        percentage =
            (spent / budgetAmount) * 100;
    }


    budgetTotal.textContent =
        `₹${budgetAmount.toFixed(2)}`;

    budgetSpent.textContent =
        `₹${spent.toFixed(2)}`;

    budgetRemaining.textContent =
    `₹${remaining.toFixed(2)}`;

// Remove previous status classes
budgetProgress.classList.remove(
    "normal",
    "warning",
    "danger"
);

budgetRemaining.classList.remove(
    "warning",
    "danger"
);

// Set status based on percentage
if (percentage >= 100) {

    budgetProgress.classList.add("danger");
    budgetRemaining.classList.add("danger");

} else if (percentage >= 75) {

    budgetProgress.classList.add("warning");
    budgetRemaining.classList.add("warning");

} else {

    budgetProgress.classList.add("normal");
}

// Progress bar
budgetProgress.style.width =
    `${Math.min(percentage, 100)}%`;

budgetPercentage.textContent =
    `${percentage.toFixed(1)}% used`;
}