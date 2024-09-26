const jwtToken = localStorage.getItem("jwtToken");
if (!jwtToken) {
    window.location.href = "index.html";
}

// Logout functionality
document.getElementById("logout-button").addEventListener("click", () => {
    localStorage.removeItem("jwtToken");
    window.location.href = "index.html";
});

// GraphQL queries
async function Query(query, token) {
    const response = await fetch(
        "https://01.kood.tech/api/graphql-engine/v1/graphql",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ query }),
        }
    );
    const result = await response.json();
    return result.data;
}

(async () => {
    try {
        const userIdQuery = `
            query {
                user {
                    id
                }
            }
        `;
        let IdData = await Query(userIdQuery, jwtToken);
        const userID = IdData.user[0].id;

        const query = `query {
            downTransactions: transaction_aggregate(
                where: { userId: { _eq: ${userID} }, type: { _eq: "down" } }
            ) {
                aggregate {
                    count
                }
            }
            upTransactions: transaction_aggregate(
                where: { userId: { _eq: ${userID} }, type: { _eq: "up" } }
            ) {
                aggregate {
                    count
                }
            }
            event(where: { id: { _eq: 148 } }) {
                createdAt
            }
            user(where: { id: { _eq: ${userID} } }) {
                id
                email
                login
                auditRatio
                attrs
                profile
                totalXP: transactions_aggregate(
                    where: {
                        type: { _eq: "xp" },
                        event: { id: { _eq: 148 } }
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
                transactions(
                    where: {
                        type: { _eq: "xp" },
                        event: { id: { _eq: 148 } }
                    },
                    order_by: { createdAt: asc }
                ) {
                    amount
                    path
                    type
                    createdAt
                }
            }
        }`;

        let data = await Query(query, jwtToken);
        let usr = data.user[0];

        let userName = "";

        if (usr.attrs && usr.attrs.firstName && usr.attrs.lastName) {
            userName = `${usr.attrs.firstName} ${usr.attrs.lastName}`;
        } else if (usr.login) {
            userName = usr.login;
        } else if (usr.email) {
            userName = usr.email;
        } else {
            userName = "Your";
        }

        // Update the heading with the user's name
        document.getElementById(
            "profile-heading"
        ).textContent = `${userName}'s Profile`;

        document.getElementById("profile-info").innerHTML = `
            <p>ID: ${usr.id}</p>
            <p>Login: ${usr.login}</p>
            <p>Email: ${usr.email}</p>
        `;

        let totalXP = usr.totalXP.aggregate.sum.amount || 0;
        document.getElementById("xpText").textContent = totalXP;

        let auditRat = usr.auditRatio + "";
        document.getElementById("ratioText").textContent = auditRat.slice(0, 6);

        let cumulativeXP = 0;
        let xpArr = [];
        xpArr.push({
            xp: 0,
            day: data.event[0].createdAt,
            event: "Beginning of the school",
        });
        usr.transactions.forEach((trans) => {
            cumulativeXP += trans.amount;
            xpArr.push({
                xp: cumulativeXP,
                day: trans.createdAt,
                event: trans.path.substring(trans.path.lastIndexOf("/") + 1),
            });
        });

        const xpLabels = xpArr.map((entry) =>
            new Date(entry.day).toLocaleDateString()
        );
        const xpData = xpArr.map((entry) => entry.xp);

        const xpCtx = document.getElementById("xpChart").getContext("2d");
        new Chart(xpCtx, {
            type: "line",
            data: {
                labels: xpLabels,
                datasets: [
                    {
                        label: "Cumulative XP Over Time",
                        data: xpData,
                        borderColor: "blue",
                        backgroundColor: "lightblue",
                        fill: true,
                    },
                ],
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Date",
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Cumulative XP",
                        },
                    },
                },
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const index = context.dataIndex;
                                const eventName = xpArr[index].event;
                                return `XP: ${context.formattedValue}, Event: ${eventName}`;
                            },
                        },
                    },
                },
            },
        });

        const pieData = [
            {
                label: "Audits Given",
                value: data.upTransactions.aggregate.count,
                color: "purple",
            },
            {
                label: "Audits Received",
                value: data.downTransactions.aggregate.count,
                color: "#2d2c2e",
            },
        ];
        const pieLabels = pieData.map((item) => item.label);
        const pieValues = pieData.map((item) => item.value);
        const pieColors = pieData.map((item) => item.color);

        const auditCtx = document.getElementById("auditChart").getContext("2d");
        new Chart(auditCtx, {
            type: "pie",
            data: {
                labels: pieLabels,
                datasets: [
                    {
                        data: pieValues,
                        backgroundColor: pieColors,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: "Audits Given vs. Received",
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || "";
                                const value = context.formattedValue;
                                return `${label}: ${value}`;
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert(
            "An error occurred while fetching your data. Please try again later."
        );
    }
})();
