Get-Content backend/.env | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$') {
        $key = $matches[1]
        $val = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
    }
}
mvn -f backend/pom.xml spring-boot:run "-Dspring-boot.run.profiles=aiven" "-Dmaven.test.skip=true"
