#!/bin/bash
# Auto-fix check errors script
# Automatically fix errors and retry up to 10 times when pnpm check has errors

MAX_ATTEMPTS=10
ATTEMPT=0
HAS_ERRORS=true

echo "Starting code check and auto-fix..."
echo "Max attempts: $MAX_ATTEMPTS"
echo ""

while [ "$HAS_ERRORS" = true ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "========================================"
    echo "Attempt $ATTEMPT"
    echo "========================================"
    
    # Run check
    echo "Running pnpm check..."
    if pnpm check; then
        echo ""
        echo "Check passed! No errors found."
        HAS_ERRORS=false
        break
    fi
    
    echo ""
    echo "Errors found, attempting auto-fix..."
    
    # Run auto-fix
    echo "Running biome check --write..."
    pnpm biome check --write
    
    echo ""
    
    # If reached max attempts, show final errors
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
        echo "========================================"
        echo "Reached max attempts ($MAX_ATTEMPTS)"
        echo "There are still errors that need manual fixing:"
        echo "========================================"
        pnpm check
        exit 1
    fi
done

if [ "$HAS_ERRORS" = false ]; then
    echo ""
    echo "========================================"
    echo "All errors fixed!"
    echo "========================================"
    exit 0
fi
