@echo off
title Smart Base - ניהול בית ספר
cd /d "c:\tmp\claude\שרה\smart-base"
echo מפעיל Smart Base...
start /b npm run dev -- --port 5175
ping -n 4 127.0.0.1 > nul
start http://localhost:5175
npm run dev -- --port 5175
