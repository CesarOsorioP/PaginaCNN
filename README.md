# MedScan AI - Plataforma web de detección de patologías en radiografías de tórax

Este el repositorio correspondiente al desarrollo de la plataforma web del trabajo de grado de Santiago Gesamá Valencia y Cesar Augusto Osorio, titulado "*Desarrollo de prototipo de aplicación web con modelo de inteligencia artificial integrado que analiza y reconoce afecciones médicas en radiografía de tórax*.

---

## Características

- **Detección Multietiqueta**: Clasificación de 8 afecciones distintas (Neumonía, Atelectasia, Edema pulmonar, Tuberculosis pulmonar, COVID-19, Nódulos pulmonares, Masa pulmonar, radiografía sin hallazgo (Normal)).
- **IA Explicable (EXAI)**: Generación de mapas de calor para visualizar las regiones de interés que el modelo analizó.
- **Microservicios**: Arquitectura dividida en Frontend, Backend (Node.js) y un servicio dedicado de Inferencia (Python/FastAPI).
- **Gestión de Reportes**: Generación de reportes en formato PDF con los resultados y las visualizaciones otorgadas por el modelo.
- **Seguridad**: Autenticación de usuarios y almacenamiento de imágenes en el servicio Cloudinary.

---

##  Estructura del Proyecto

### 1.  [Client](./client) (Frontend)
Desarrollado con **React** y **Tailwind CSS**. Cuenta con vistas representativas como *Landing Page*, *Dashboard para acceder a todas las vistas*, *Perfil para actualización de datos*, *Subida para realizar carga de imágenes*, *Reportes para ver el análisis detallado*, *Historial para acceder a reportes anteriores* y *Gestión de usuarios*.

### 2.  [Server](./server) (Backend API)

Desarrollado con **Node.js** y **Express**. Cuenta con tecnologías como  MongoDB (Mongoose), JWT para autenticación, Cloudinary para almacenamiento. Su propósito es ser el orquestador principal de servicios, asegurando la gestión de usuarios y guardado de análisis.

**ONNX Runtime**: Capacidad para ejecutar modelos en un formato `.onnx`. Se utiliza principalmente para ejecutar el modelo *.pth* correspondiente al preclasificador binario (análisis de imagen: Es una radiografía de tórax o es otra imagen).

### 3.  [Python-EXAI](./python-exai) (Servicio de IA)
Microservicio especializado en el modelo multietiqueta para la detección de enfermedades en las radiografías de tórax y visualización con mapas de calor.
Desarrollado con FastAPI, PyTorch, OpenCV, Grad-CAM. Su propósito es cargar el modelo multietiqueta  *.pth* en PyTorch, donde procesa las imágenes y genera los mapas de calor de interpretabilidad.

---

##  Tecnologías Utilizadas

| Componente | Tecnologías |
| :--- | :--- |
| **Arquitectura CNN** | DenseNet-121 (Pre-entrenada con ImageNet) |
| **Deep Learning** | PyTorch, ONNX |
| **Frontend** | React, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, MongoDB Atlas |
| **Almacenamiento** | Cloudinary |

---

## Configuración 

### 1. Clonar el repositorio
```bash
git clone https://github.com/CesarOsorioP/PaginaCNN.git
```

### 2. Configurar el Backend (Server)
```bash
cd PaginaCNN
cd server
npm install
# Crear archivo .env basado en la configuración necesaria (MONGO_URI, CLOUDINARY_URL, etc.)
npm start
```

### 3. Configurar el Frontend (Client)
```bash
cd ../client
npm install
npm start
```

### 4. Configurar el Microservicio de IA (Python-EXAI)
```bash
cd ../python-exai
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

## Modelo

El sistema utiliza un modelo **DenseNet-121** entrenado para clasificación multietiqueta. 
- El archivo del modelo principal se encuentra en el repositorio **https://huggingface.co/CesarOsorioP/densenet-xray-model**. bajo el nombre *densenet_multilabel_model.pth*. Una vez descargado se debe pegar en la carpeta raíz.


---

## Autores
**Cesar Augusto Osorio Pareja** - *Trabajo de Grado*

**Santiago Gesamá Valencia** - *Trabajo de Grado*
