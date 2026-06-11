
export const PATH_TO_ROOT = '../../../'

export const API_MAIN_GO_CMD = 'cd budget_tracker_api && GOARCH=arm64 GOOS=linux CGO_ENABLED=0 GOCACHE=/tmp/go-cache go build -o /asset-output/bootstrap ./cmd/api'
export const SYNC_MAIN_GO_CMD = 'cd budget_tracker_api && GOARCH=arm64 GOOS=linux CGO_ENABLED=0 GOCACHE=/tmp/go-cache go build -o /asset-output/bootstrap ./cmd/sync'

export const GO_BUILD_COMMAND = ['sh', '-c']
