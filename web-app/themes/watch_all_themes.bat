@echo off

for /d %%d in ("*.theme") do (
    cd %%d\stylesheets
    start /min cmd /c compass watch %1
    cd ..\..
)
