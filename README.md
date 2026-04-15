# Pizzapolis v2

Local-first Vite + React version of the pizza map app.

## What changed

- Base44 removed
- Local demo user built in
- Data stored in localStorage
- Map, places, ratings, favorites and hangouts work without external backend

## Run

```powershell
Set-Location "C:\Users\Jose\Desktop\pizzapolisv2"
npm install
npm run dev
```

## Reset local demo data

Open the browser console and run:

```js
localStorage.removeItem("pizzapolis_local_db");
localStorage.removeItem("pizzapolis_demo_user");
location.reload();
```
