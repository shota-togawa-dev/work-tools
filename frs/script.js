const stickyCta = document.querySelector(".sticky-cta");
const contactSection = document.querySelector("#contact");
const demoSubmit = document.querySelector("#demoSubmit");
const photoInput = document.querySelector("#moldPhoto");
const previewPanel = document.querySelector("#previewPanel");
const photoPreview = document.querySelector("#photoPreview");
const diagnosisResult = document.querySelector("#diagnosisResult");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const moldScore = document.querySelector("#moldScore");
const estimatePrice = document.querySelector("#estimatePrice");
const scoreBar = document.querySelector("#scoreBar");

let uploadedImage = null;
let uploadedImageUrl = "";

function updateStickyCta() {
  if (!stickyCta || !contactSection) return;

  const contactTop = contactSection.getBoundingClientRect().top + window.scrollY;
  const shouldShow = window.scrollY > 520 && window.scrollY < contactTop - 360;
  stickyCta.classList.toggle("is-visible", shouldShow);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => resolve({ image, url });
    image.onerror = () => reject(new Error("画像を読み込めませんでした"));
    image.src = url;
  });
}

function analyzeImage(image) {
  const canvas = document.createElement("canvas");
  const size = 180;
  const ratio = image.width / image.height;

  canvas.width = ratio >= 1 ? size : Math.max(1, Math.round(size * ratio));
  canvas.height = ratio >= 1 ? Math.max(1, Math.round(size / ratio)) : size;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let darkPixels = 0;
  let greenPixels = 0;
  let lowSaturationDarkPixels = 0;
  let totalBrightness = 0;
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const brightness = (red + green + blue) / 3;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const saturation = max === 0 ? 0 : (max - min) / max;

    totalBrightness += brightness;

    if (brightness < 82) darkPixels += 1;
    if (green > red * 1.08 && green > blue * 1.04 && green > 58 && saturation > 0.16) greenPixels += 1;
    if (brightness < 112 && saturation < 0.18) lowSaturationDarkPixels += 1;
  }

  const darkRatio = darkPixels / totalPixels;
  const greenRatio = greenPixels / totalPixels;
  const grayDarkRatio = lowSaturationDarkPixels / totalPixels;
  const averageBrightness = totalBrightness / totalPixels;
  const score = Math.min(96, Math.round((darkRatio * 72) + (greenRatio * 110) + (grayDarkRatio * 54) + (averageBrightness < 125 ? 8 : 0)));

  return { score, darkRatio, greenRatio, grayDarkRatio };
}

function formatYenRange(min, max) {
  return `${min.toLocaleString()}〜${max.toLocaleString()}円`;
}

function estimateCost(place, area, score) {
  const baseByPlace = {
    "外壁": [18000, 42000],
    "浴室": [15000, 35000],
    "室内": [18000, 40000],
    "その他": [20000, 45000]
  };
  const multiplierByArea = {
    small: 1,
    medium: 1.7,
    large: 3.1,
    xlarge: 5.2
  };
  const severityMultiplier = score >= 70 ? 1.35 : score >= 45 ? 1.15 : 1;
  const [baseMin, baseMax] = baseByPlace[place] || baseByPlace["その他"];
  const multiplier = (multiplierByArea[area] || 1) * severityMultiplier;

  const min = Math.round((baseMin * multiplier) / 1000) * 1000;
  const max = Math.round((baseMax * multiplier) / 1000) * 1000;

  return formatYenRange(min, max);
}

function buildDiagnosis(place, analysis) {
  if (analysis.score >= 70) {
    return {
      title: "カビ汚れの可能性が高そうです",
      text: `${place}の写真から、黒ずみや緑色汚れに近い色のまとまりが確認されました。FRS工法で落とせるか、現場確認やテスト施工で判断する価値があります。`
    };
  }

  if (analysis.score >= 45) {
    return {
      title: "カビ汚れの可能性があります",
      text: `${place}に、カビ・藻・湿気由来の汚れに近い傾向が見られます。写真だけでは断定せず、範囲と素材を確認してから施工可否を判断します。`
    };
  }

  return {
    title: "写真だけではカビと断定しにくい状態です",
    text: `${place}の写真では、カビ以外の汚れや影の影響も考えられます。落とせる可能性を確認するため、別角度の写真や現場確認をおすすめします。`
  };
}

function showDiagnosis() {
  const form = demoSubmit?.closest("form");
  const place = form?.querySelector('[name="place"]')?.value || "外壁";
  const area = form?.querySelector('[name="area"]')?.value || "small";

  if (!uploadedImage) {
    window.alert("先に気になる場所の写真を選択してください。");
    photoInput?.focus();
    return;
  }

  const analysis = analyzeImage(uploadedImage);
  const diagnosis = buildDiagnosis(place, analysis);

  resultTitle.textContent = diagnosis.title;
  resultText.textContent = diagnosis.text;
  moldScore.textContent = `${analysis.score}%`;
  estimatePrice.textContent = estimateCost(place, area, analysis.score);
  scoreBar.style.width = `${analysis.score}%`;
  diagnosisResult.hidden = false;
  diagnosisResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

window.addEventListener("scroll", updateStickyCta, { passive: true });
window.addEventListener("resize", updateStickyCta);
updateStickyCta();

photoInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const { image, url } = await loadImageFromFile(file);

    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImage = image;
    uploadedImageUrl = url;
    photoPreview.src = url;
    previewPanel.hidden = false;
    diagnosisResult.hidden = true;
  } catch {
    window.alert("画像を読み込めませんでした。別の写真でお試しください。");
  }
});

demoSubmit?.addEventListener("click", showDiagnosis);
