from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from fastapi.staticfiles import StaticFiles
from routes import pizza_routes, auth_routes, protected_routes, worker_routes



Base.metadata.create_all(bind=engine) 

app = FastAPI() 
app.mount("/pizza_images", StaticFiles(directory="pizza_images"), name="pizza_images")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)

app.include_router(pizza_routes.router) 
app.include_router(auth_routes.router)
app.include_router(protected_routes.router) 
app.include_router(worker_routes.router)
app.mount("/user_images", StaticFiles(directory="user_images"), name="user_images")



@app.get("/test")
def test():
    return {"message": "Сервер работает"}
@app.get("/test-routes")
def test_routes():
    return {"routes": "pizza_routes подключён"}




