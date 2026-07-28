
export const PATH_TO_ROOT = '../../../'

export const API_MAIN_GO_CMD = 'cd budget_tracker_api && GOARCH=arm64 GOOS=linux CGO_ENABLED=0 GOCACHE=/tmp/go-cache go build -o /asset-output/bootstrap ./cmd/api'
export const SYNC_MAIN_GO_CMD = 'cd budget_tracker_api && GOARCH=arm64 GOOS=linux CGO_ENABLED=0 GOCACHE=/tmp/go-cache go build -o /asset-output/bootstrap ./cmd/sync'

export const GO_BUILD_COMMAND = ['sh', '-c']

export const PLAID_ENV = "sandbox"
export const PLAID_CLIENT_ID = "6a685c6553bb65000e88158b"
export const PLAID_REDIRECT_URI = "http://localhost:3000/"
export const PLAID_COUNTRY_CODES = "US"
export const PLAID_PRODUCTS = "auth,transactions,signal"