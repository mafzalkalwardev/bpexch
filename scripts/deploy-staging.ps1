#!/usr/bin/env pwsh
# BPExch staging deploy script
param(
    [switch]$SkipDocker,
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not $SkipDocker) {
    Write-Host "Starting Docker services..."
    docker compose up -d
    Start-Sleep -Seconds 5
}

Write-Host "Pushing database schema..."
npm run db:push

if (-not $SkipSeed) {
    Write-Host "Seeding database..."
    npm run db:seed
}

Write-Host "Building packages..."
npm run build -w @bpexch/shared
npm run build -w @bpexch/db
npm run build -w @bpexch/api
npm run build -w @bpexch/web

Write-Host ""
Write-Host "Deploy ready. Start services:"
Write-Host "  npm run dev -w @bpexch/api   # http://localhost:3001"
Write-Host "  npm run dev -w @bpexch/web   # http://localhost:3000"
