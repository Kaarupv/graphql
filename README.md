# K/J Personal Profile Dashboard
A web application that displays K/J student profile information and visualizes progress using interactive charts.

[Live Demo on GitHub Pages](https://kaarupv.github.io/graphql/)

### Features
- **User Authentication:** Secure login using JWT tokens.
- **Profile Information:** Display user ID, login, and email.
- **Statistics:** Show total XP and audit ratio.
- **Interactive Charts:** Visualize cumulative XP over time and audit statistics using Chart.js.

### Technologies
- HTML, CSS, JavaScript
- GraphQL
- Chart.js

### File Overview
```
.
├── README.md
├── index.html             # Login page
├── profile.html           # Profile dashboard
├── css/
│   └── styles.css         # Application styling
└── js/
    ├── login.js           # Handles login functionality
    ├── profile.js         # Fetches and displays user data
    └── queries.js         # Contains GraphQL queries

```

### Audit requirements
https://github.com/01-edu/public/tree/master/subjects/graphql/audit