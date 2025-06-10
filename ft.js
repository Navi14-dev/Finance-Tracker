let transactions = [];
        let budgetGoal = 0;
        let savingsTarget = 0;
        let currentTab = 'transactions';

        // Load data from memory (simulating localStorage functionality)
        function loadData() {
            // In a real environment, this would load from localStorage
            // For demo purposes, we'll start with empty data
            updateDisplay();
        }

        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.getElementById(`${tab}-tab`).classList.add('active');
            
            currentTab = tab;
            
            if (tab === 'reports') {
                updateReports();
            } else if (tab === 'budget') {
                updateBudgetDisplay();
            }
        }

        function addTransaction(type) {
            const amountInput = document.getElementById(`${type}-amount`);
            const categorySelect = document.getElementById(`${type}-category`);
            const descriptionInput = document.getElementById(`${type}-description`);
            const paymentSelect = document.getElementById(`${type}-payment`);
            
            const amount = parseFloat(amountInput.value);
            const category = categorySelect.value;
            const description = descriptionInput.value;
            const payment = paymentSelect.value;
            
            if (!amount || amount <= 0) {
                showNotification('Please enter a valid amount!', 'error');
                return;
            }
            
            if (!description.trim()) {
                showNotification('Please enter a description!', 'error');
                return;
            }
            
            const transaction = {
                id: Date.now(),
                type: type,
                amount: amount,
                category: category,
                description: description,
                payment: payment,
                date: new Date(),
                dateString: new Date().toLocaleString()
            };
            
            transactions.unshift(transaction);
            
            // Clear inputs
            amountInput.value = '';
            descriptionInput.value = '';
            
            updateDisplay();
            showNotification(`${type === 'income' ? '💰' : '💸'} ${type.charAt(0).toUpperCase() + type.slice(1)} of $${amount.toFixed(2)} added successfully!`);
        }

        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                updateDisplay();
                showNotification('Transaction deleted successfully!', 'success');
            }
        }

        function updateDisplay() {
            updateBalance();
            updateMonthlyStats();
            updateTransactionsList();
            updateCategoryChart();
            updateFilterOptions();
            updateBudgetDisplay();
        }

        function updateBalance() {
            const balance = transactions.reduce((total, transaction) => {
                return transaction.type === 'income' 
                    ? total + transaction.amount 
                    : total - transaction.amount;
            }, 0);
            
            document.getElementById('balance').textContent = `$${balance.toFixed(2)}`;
            
            const balanceCard = document.querySelector('.balance-card');
            if (balance >= 0) {
                balanceCard.style.background = 'linear-gradient(135deg, #4caf50, #81c784)';
            } else {
                balanceCard.style.background = 'linear-gradient(135deg, #f44336, #ef5350)';
            }
        }

        function updateMonthlyStats() {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const monthlyTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            });
            
            const income = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            document.getElementById('monthly-income').textContent = income.toFixed(2);
            document.getElementById('monthly-expenses').textContent = expenses.toFixed(2);
            document.getElementById('monthly-net').textContent = (income - expenses).toFixed(2);
            document.getElementById('monthly-count').textContent = monthlyTransactions.length;
            
            // Update quick stats
            document.getElementById('month-income').textContent = `${income.toFixed(2)}`;
            document.getElementById('month-expenses').textContent = `${expenses.toFixed(2)}`;
        }

        function updateTransactionsList() {
            const container = document.getElementById('transactions-list');
            
            if (transactions.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 40px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                        <p>No transactions yet. Add your first transaction above!</p>
                    </div>
                `;
                return;
            }
            
            const displayTransactions = getFilteredTransactions().slice(0, 20);
            
            container.innerHTML = displayTransactions.map(transaction => `
                <div class="transaction-item transaction-${transaction.type}">
                    <div class="transaction-info">
                        <div class="transaction-icon">
                            ${getCategoryIcon(transaction.category)}
                        </div>
                        <div class="transaction-details">
                            <h5>${transaction.category}</h5>
                            <p><strong>${transaction.description}</strong></p>
                            <p>💳 ${transaction.payment} • ${transaction.dateString}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                        ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </div>
                    <button class="delete-btn" onclick="deleteTransaction(${transaction.id})" title="Delete transaction">
                        ✖
                    </button>
                </div>
            `).join('');
        }

        function updateCategoryChart() {
            const categories = {};
            transactions.filter(t => t.type === 'expense').forEach(transaction => {
                categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
            });
            
            const sortedCategories = Object.entries(categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8);
            
            const container = document.getElementById('category-chart');
            
            if (sortedCategories.length === 0) {
                container.innerHTML = '<div class="category-item">🎯 No expenses yet</div>';
                return;
            }
            
            container.innerHTML = sortedCategories.map(([category, amount]) => `
                <div class="category-item">
                    ${getCategoryIcon(category)} ${category}: ${amount.toFixed(2)}
                </div>
            `).join('');
        }

        function updateFilterOptions() {
            const categoryFilter = document.getElementById('filter-category');
            const categories = [...new Set(transactions.map(t => t.category))];
            
            categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${getCategoryIcon(cat)} ${cat}</option>`).join('');
        }

        function getFilteredTransactions() {
            const typeFilter = document.getElementById('filter-type').value;
            const categoryFilter = document.getElementById('filter-category').value;
            const periodFilter = document.getElementById('filter-period').value;
            
            return transactions.filter(transaction => {
                // Type filter
                if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
                
                // Category filter
                if (categoryFilter !== 'all' && transaction.category !== categoryFilter) return false;
                
                // Period filter
                if (periodFilter !== 'all') {
                    const transactionDate = new Date(transaction.date);
                    const now = new Date();
                    
                    switch (periodFilter) {
                        case 'today':
                            if (transactionDate.toDateString() !== now.toDateString()) return false;
                            break;
                        case 'week':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            if (transactionDate < weekAgo) return false;
                            break;
                        case 'month':
                            if (transactionDate.getMonth() !== now.getMonth() || 
                                transactionDate.getFullYear() !== now.getFullYear()) return false;
                            break;
                        case 'year':
                            if (transactionDate.getFullYear() !== now.getFullYear()) return false;
                            break;
                    }
                }
                
                return true;
            });
        }

        function filterTransactions() {
            updateTransactionsList();
        }

        function setBudgetGoal() {
            budgetGoal = parseFloat(document.getElementById('budget-limit').value) || 0;
            updateBudgetDisplay();
            showNotification(`Budget goal set to ${budgetGoal.toFixed(2)}!`);
        }

        function setSavingsGoal() {
            savingsTarget = parseFloat(document.getElementById('savings-target').value) || 0;
            updateBudgetDisplay();
            showNotification(`Savings goal set to ${savingsTarget.toFixed(2)}!`);
        }

        function updateBudgetDisplay() {
            // Budget progress
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const monthlyExpenses = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'expense' && 
                           tDate.getMonth() === currentMonth && 
                           tDate.getFullYear() === currentYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (budgetGoal > 0) {
                const budgetProgress = Math.min((monthlyExpenses / budgetGoal) * 100, 100);
                document.getElementById('budget-progress').style.width = `${budgetProgress}%`;
                document.getElementById('budget-progress-text').textContent = `${monthlyExpenses.toFixed(2)} / ${budgetGoal.toFixed(2)}`;
                
                const remaining = budgetGoal - monthlyExpenses;
                if (remaining > 0) {
                    document.getElementById('budget-status').textContent = `💚 ${remaining.toFixed(2)} remaining this month`;
                    document.getElementById('budget-status').style.color = '#4caf50';
                } else {
                    document.getElementById('budget-status').textContent = `🚨 Over budget by ${Math.abs(remaining).toFixed(2)}`;
                    document.getElementById('budget-status').style.color = '#f44336';
                }
            }
            
            // Savings progress
            const totalBalance = transactions.reduce((total, t) => {
                return t.type === 'income' ? total + t.amount : total - t.amount;
            }, 0);
            
            if (savingsTarget > 0) {
                const savingsProgress = Math.min((totalBalance / savingsTarget) * 100, 100);
                document.getElementById('savings-progress').style.width = `${savingsProgress}%`;
                document.getElementById('savings-progress-text').textContent = `${totalBalance.toFixed(2)} / ${savingsTarget.toFixed(2)}`;
                
                const remaining = savingsTarget - totalBalance;
                if (remaining > 0) {
                    document.getElementById('savings-status').textContent = `💪 ${remaining.toFixed(2)} more to reach your goal!`;
                    document.getElementById('savings-status').style.color = '#667eea';
                } else {
                    document.getElementById('savings-status').textContent = `🎉 Congratulations! Goal achieved!`;
                    document.getElementById('savings-status').style.color = '#4caf50';
                }
            }
        }

        function updateReports() {
            updateMonthlyStats();
            updateFinancialHealth();
            updateInsights();
        }

        function updateFinancialHealth() {
            let score = 50; // Base score
            
            const monthlyIncome = transactions
                .filter(t => t.type === 'income' && isCurrentMonth(t.date))
                .reduce((sum, t) => sum + t.amount, 0);
            
            const monthlyExpenses = transactions
                .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
                .reduce((sum, t) => sum + t.amount, 0);
            
            const totalBalance = transactions.reduce((total, t) => {
                return t.type === 'income' ? total + t.amount : total - t.amount;
            }, 0);
            
            // Scoring factors
            if (totalBalance > 0) score += 20;
            if (monthlyIncome > monthlyExpenses) score += 15;
            if (transactions.length > 10) score += 10; // Regular tracking
            if (budgetGoal > 0 && monthlyExpenses <= budgetGoal) score += 5;
            
            score = Math.min(Math.max(score, 0), 100);
            
            document.getElementById('health-score').textContent = score;
            document.getElementById('health-progress').style.width = `${score}%`;
            
            let advice = '';
            if (score >= 80) {
                advice = '🌟 Excellent! Your finances are in great shape!';
            } else if (score >= 60) {
                advice = '👍 Good job! Keep up the consistent tracking.';
            } else if (score >= 40) {
                advice = '📈 You\'re on the right track. Consider setting a budget.';
            } else {
                advice = '💪 Start by tracking all expenses and setting goals.';
            }
            
            document.getElementById('health-advice').textContent = advice;
        }

        function updateInsights() {
            const insights = [];
            
            const monthlyExpenses = transactions
                .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
                .reduce((sum, t) => sum + t.amount, 0);
            
            const monthlyIncome = transactions
                .filter(t => t.type === 'income' && isCurrentMonth(t.date))
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Generate insights
            if (monthlyExpenses > monthlyIncome) {
                insights.push('⚠️ You\'re spending more than you earn this month');
            }
            
            const categorySpending = {};
            transactions.filter(t => t.type === 'expense' && isCurrentMonth(t.date))
                .forEach(t => {
                    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
                });
            
            const topCategory = Object.entries(categorySpending)
                .sort(([,a], [,b]) => b - a)[0];
            
            if (topCategory) {
                insights.push(`💸 Your biggest expense category is ${topCategory[0]} (${topCategory[1].toFixed(2)})`);
            }
            
            if (transactions.length > 0) {
                const avgTransaction = transactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0) / transactions.filter(t => t.type === 'expense').length;
                insights.push(`📊 Your average expense is ${avgTransaction.toFixed(2)}`);
            }
            
            if (insights.length === 0) {
                insights.push('📊 Add more transactions to get personalized insights!');
            }
            
            document.getElementById('insights-list').innerHTML = insights
                .map(insight => `<p style="margin-bottom: 10px;">${insight}</p>`)
                .join('');
        }

        function isCurrentMonth(date) {
            const transactionDate = new Date(date);
            const now = new Date();
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
        }

        function getCategoryIcon(category) {
            const icons = {
                // Income categories
                'Salary': '💼',
                'Freelance': '🎨',
                'Investment': '📈',
                'Business': '🏢',
                'Rental': '🏠',
                'Bonus': '🎁',
                'Commission': '💼',
                'Gift': '🎉',
                'Refund': '🔄',
                
                // Expense categories
                'Food & Dining': '🍕',
                'Groceries': '🛒',
                'Transportation': '🚗',
                'Shopping': '🛍️',
                'Bills & Utilities': '⚡',
                'Entertainment': '🎬',
                'Health & Medical': '🏥',
                'Education': '📚',
                'Travel': '✈️',
                'Insurance': '🛡️',
                'Rent/Mortgage': '🏠',
                'Subscriptions': '📺',
                'Pets': '🐕',
                'Gifts & Donations': '🎁',
                'Personal Care': '💄'
            };
            return icons[category] || '🎯';
        }

        function exportData() {
            document.getElementById('export-modal').classList.add('show');
        }

        function closeModal() {
            document.getElementById('export-modal').classList.remove('show');
        }

        function exportToCSV() {
            const csvContent = [
                ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount'],
                ...transactions.map(t => [
                    t.dateString,
                    t.type,
                    t.category,
                    t.description,
                    t.payment,
                    t.amount
                ])
            ].map(row => row.join(',')).join('\n');
            
            downloadFile(csvContent, 'finance-data.csv', 'text/csv');
            closeModal();
            showNotification('Data exported as CSV!');
        }

        function exportToJSON() {
            const jsonContent = JSON.stringify({
                transactions,
                budgetGoal,
                savingsTarget,
                exportDate: new Date().toISOString()
            }, null, 2);
            
            downloadFile(jsonContent, 'finance-data.json', 'application/json');
            closeModal();
            showNotification('Data exported as JSON!');
        }

        function downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Initialize the app
        loadData();

        // Add some demo data for testing
        if (transactions.length === 0) {
            setTimeout(() => {
                showNotification('💡 Tip: Add your first transaction using the forms above!', 'success');
            }, 2000);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        switchTab('transactions');
                        break;
                    case '2':
                        event.preventDefault();
                        switchTab('budget');
                        break;
                    case '3':
                        event.preventDefault();
                        switchTab('reports');
                        break;
                }
            }
        });