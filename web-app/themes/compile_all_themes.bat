@echo off

for /d %%d in ("*.theme") do (
    cd %%d\stylesheets
    compass compile %1
    if errorlevel 1 exit 1
    cd ..\..
)
