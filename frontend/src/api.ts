export async function getDetection() {
  const response = await fetch('http://localhost:5000/detection/your-endpoint');
  const data = await response.json();
  return data;
}
