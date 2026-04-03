"""MethSight backend - Satellite methane detection AI pipeline."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import alerts, detect, facilities, simulation, timeseries

app = FastAPI(
    title="MethSight API",
    description="Satellite methane detection and attribution",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(alerts.router, prefix="/api", tags=["alerts"])
app.include_router(detect.router, prefix="/api", tags=["detection"])
app.include_router(facilities.router, prefix="/api", tags=["facilities"])
app.include_router(simulation.router, prefix="/api", tags=["simulation"])
app.include_router(timeseries.router, prefix="/api", tags=["timeseries"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
