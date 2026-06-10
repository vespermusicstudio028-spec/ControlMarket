@echo off
title ControlMarket - Deploy Automatizado
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy.ps1
pause
