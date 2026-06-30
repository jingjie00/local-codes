import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import './styles.css';

const previewSize = 512;

const state = {
  mode: 'qr',
  type: 'url',
  dotColor: '#111827',
  transparentCode: false,
  backgroundColor: '#ffffff',
  transparentBackground: true,
  errorCorrectionLevel: 'H',
  margin: 4,
  jpgSize: 1024,
  dotStyle: 'square',
  roundness: 0.8,
  logoDataUrl: '',
  logoImage: null,
  logoSize: 18,
  barcodeValue: '123456789012',
  barcodeFormat: 'CODE128',
  barcodeText: true,
  fields: {
    url: 'https://example.com',
    text: 'Hello from a fully local QR generator.',
    email: 'hello@example.com',
    emailSubject: '',
    emailBody: '',
    phone: '+15551234567',
    smsPhone: '+15551234567',
    smsBody: '',
    wifiSsid: '',
    wifiPassword: '',
    wifiEncryption: 'WPA',
    wifiHidden: false
  }
};

const elements = {
  modeButtons: [...document.querySelectorAll('.mode-button')],
  typeButtons: [...document.querySelectorAll('.type-button')],
  qrTypeSection: document.querySelector('#qr-type-section'),
  qrStyleSection: document.querySelector('#qr-style-section'),
  qrLogoSection: document.querySelector('#qr-logo-section'),
  qrSettingsSection: document.querySelector('#qr-settings-section'),
  dynamicFields: document.querySelector('#dynamic-fields'),
  barcodeFields: document.querySelector('#barcode-fields'),
  barcodeValue: document.querySelector('#barcode-value'),
  barcodeFormat: document.querySelector('#barcode-format'),
  barcodeText: document.querySelector('#barcode-text'),
  dotColor: document.querySelector('#dot-color'),
  dotColorText: document.querySelector('#dot-color-text'),
  transparentCode: document.querySelector('#transparent-code'),
  backgroundColor: document.querySelector('#background-color'),
  backgroundColorText: document.querySelector('#background-color-text'),
  transparentBackground: document.querySelector('#transparent-background'),
  dotStyleButtons: [...document.querySelectorAll('[data-dot-style]')],
  roundness: document.querySelector('#roundness'),
  logoFile: document.querySelector('#logo-file'),
  logoName: document.querySelector('#logo-name'),
  logoPreview: document.querySelector('#logo-preview'),
  logoRemove: document.querySelector('#logo-remove'),
  logoSize: document.querySelector('#logo-size'),
  errorLevel: document.querySelector('#error-level'),
  errorLevelValue: document.querySelector('#error-level-value'),
  margin: document.querySelector('#margin'),
  marginValue: document.querySelector('#margin-value'),
  jpgSize: document.querySelector('#jpg-size'),
  jpgSizeNumber: document.querySelector('#jpg-size-number'),
  downloadSvg: document.querySelector('#download-svg'),
  downloadJpg: document.querySelector('#download-jpg'),
  canvas: document.querySelector('#qr-canvas'),
  message: document.querySelector('#message'),
  payloadSummary: document.querySelector('#payload-summary'),
  sizeSummary: document.querySelector('#size-summary')
};

const typeLabels = {
  url: 'Link',
  text: 'Text',
  email: 'Email',
  phone: 'Phone',
  sms: 'SMS',
  wifi: 'Wi-Fi'
};

const errorLevels = [
  { value: 'L', label: 'Low' },
  { value: 'M', label: 'Medium' },
  { value: 'Q', label: 'Quartile' },
  { value: 'H', label: 'High' }
];

const fieldTemplates = {
  url: [{ id: 'url', label: 'Link', type: 'url', placeholder: 'https://example.com' }],
  text: [{ id: 'text', label: 'Text', placeholder: 'Type anything to encode', multiline: true }],
  email: [
    { id: 'email', label: 'Email address', type: 'email', placeholder: 'hello@example.com' },
    { id: 'emailSubject', label: 'Subject', placeholder: 'Optional subject' },
    { id: 'emailBody', label: 'Body', placeholder: 'Optional message', multiline: true }
  ],
  phone: [{ id: 'phone', label: 'Phone number', type: 'tel', placeholder: '+15551234567' }],
  sms: [
    { id: 'smsPhone', label: 'Phone number', type: 'tel', placeholder: '+15551234567' },
    { id: 'smsBody', label: 'Message', placeholder: 'Optional SMS text', multiline: true }
  ],
  wifi: [
    { id: 'wifiSsid', label: 'Network name', placeholder: 'Wi-Fi SSID' },
    { id: 'wifiPassword', label: 'Password', type: 'password', placeholder: 'Wi-Fi password' }
  ]
};

function renderDynamicFields() {
  const fragment = document.createDocumentFragment();
  elements.dynamicFields.classList.toggle('is-expanded-text', state.type === 'text');

  fieldTemplates[state.type].forEach((field) => {
    const group = document.createElement('div');
    group.className = 'field-group';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;

    const input = field.multiline ? document.createElement('textarea') : document.createElement('input');
    input.id = field.id;
    input.name = field.id;
    input.placeholder = field.placeholder || '';
    input.value = state.fields[field.id] || '';
    if (!field.multiline) input.type = field.type || 'text';

    input.addEventListener('input', () => {
      state.fields[field.id] = input.value;
      updateCode();
    });

    group.append(label, input);
    fragment.append(group);
  });

  if (state.type === 'wifi') {
    const row = document.createElement('div');
    row.className = 'grid-2';

    const encryptionGroup = document.createElement('div');
    encryptionGroup.className = 'field-group';
    const encryptionLabel = document.createElement('label');
    encryptionLabel.htmlFor = 'wifiEncryption';
    encryptionLabel.textContent = 'Security';
    const encryption = document.createElement('select');
    encryption.id = 'wifiEncryption';
    [
      ['WPA', 'WPA/WPA2'],
      ['WEP', 'WEP'],
      ['nopass', 'None']
    ].forEach(([value, text]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      option.selected = state.fields.wifiEncryption === value;
      encryption.append(option);
    });
    encryption.addEventListener('change', () => {
      state.fields.wifiEncryption = encryption.value;
      updateCode();
    });
    encryptionGroup.append(encryptionLabel, encryption);

    const hiddenGroup = document.createElement('label');
    hiddenGroup.className = 'checkbox-control compact-check';
    const hidden = document.createElement('input');
    hidden.type = 'checkbox';
    hidden.checked = state.fields.wifiHidden;
    hidden.addEventListener('change', () => {
      state.fields.wifiHidden = hidden.checked;
      updateCode();
    });
    hiddenGroup.append(hidden, document.createTextNode('Hidden network'));

    row.append(encryptionGroup, hiddenGroup);
    fragment.append(row);
  }

  elements.dynamicFields.replaceChildren(fragment);
}

function buildPayload() {
  if (state.mode === 'barcode') return state.barcodeValue.trim();

  switch (state.type) {
    case 'url':
      return state.fields.url.trim();
    case 'text':
      return state.fields.text;
    case 'email':
      return buildEmailPayload();
    case 'phone':
      return `tel:${state.fields.phone.trim()}`;
    case 'sms':
      return buildSmsPayload();
    case 'wifi':
      return buildWifiPayload();
    default:
      return '';
  }
}

function buildEmailPayload() {
  const address = state.fields.email.trim();
  const params = new URLSearchParams();
  if (state.fields.emailSubject.trim()) params.set('subject', state.fields.emailSubject.trim());
  if (state.fields.emailBody.trim()) params.set('body', state.fields.emailBody.trim());
  const query = params.toString();
  return `mailto:${address}${query ? `?${query}` : ''}`;
}

function buildSmsPayload() {
  const phone = state.fields.smsPhone.trim();
  const body = state.fields.smsBody.trim();
  return body ? `SMSTO:${phone}:${body}` : `SMSTO:${phone}`;
}

function buildWifiPayload() {
  const ssid = escapeWifiValue(state.fields.wifiSsid);
  const password = escapeWifiValue(state.fields.wifiPassword);
  const type = state.fields.wifiEncryption;
  const hidden = state.fields.wifiHidden ? 'true' : 'false';
  return `WIFI:T:${type};S:${ssid};P:${password};H:${hidden};;`;
}

function escapeWifiValue(value) {
  return String(value).replace(/[\\;,:"]/g, '\\$&');
}

async function updateCode() {
  const payload = buildPayload();
  const isReady = payload.trim().length > 0;
  elements.downloadSvg.disabled = !isReady;
  elements.downloadJpg.disabled = !isReady;
  setPreviewDraggable(isReady);
  elements.payloadSummary.textContent =
    state.mode === 'qr' ? `${typeLabels[state.type]} QR` : `${state.barcodeFormat} Barcode`;
  elements.sizeSummary.textContent = `${state.jpgSize} px JPG`;

  if (!isReady) {
    clearCanvas(previewSize, previewSize);
    setMessage('Add content to generate a code.');
    return;
  }

  try {
    if (state.mode === 'qr') {
      renderQrToCanvas(elements.canvas, payload, previewSize);
      setMessage('Generated locally in your browser.');
    } else {
      renderBarcodeToCanvas(elements.canvas, payload, previewSize);
      setMessage('Barcode generated locally in your browser.');
    }
  } catch (error) {
    clearCanvas(previewSize, previewSize);
    setPreviewDraggable(false);
    setMessage(error.message || 'Unable to generate this code.');
  }
}

function renderQrToCanvas(canvas, payload, width, options = {}) {
  const ctx = prepareCanvas(canvas, width, width);
  const qr = QRCode.create(payload, { errorCorrectionLevel: state.errorCorrectionLevel });
  const count = qr.modules.size;
  const margin = state.margin;
  const tile = width / (count + margin * 2);

  drawQrBackground(ctx, width, options);
  ctx.save();
  if (shouldKnockOutCode(options)) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
  } else {
    ctx.fillStyle = getCodeColor();
  }

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const x = (col + margin) * tile;
      const y = (row + margin) * tile;
      if (state.dotStyle === 'rounded') {
        roundedRect(ctx, x, y, tile, tile, (tile / 2) * state.roundness);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, Math.ceil(tile), Math.ceil(tile));
      }
    }
  }
  ctx.restore();

  if (state.logoImage) {
    drawLogo(ctx, width, options);
  }
}

function drawQrBackground(ctx, width, options = {}) {
  const background = getBackgroundColor(options);
  ctx.clearRect(0, 0, width, width);
  if (background === 'transparent') return;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, width);
}

function drawLogo(ctx, width, options = {}) {
  const logoWidth = width * (state.logoSize / 100);
  const padding = logoWidth * 0.18;
  const plateWidth = logoWidth + padding * 2;
  const plateX = (width - plateWidth) / 2;
  const plateY = (width - plateWidth) / 2;
  const logoX = (width - logoWidth) / 2;
  const logoY = (width - logoWidth) / 2;

  ctx.fillStyle = getLogoPlateColor(options);
  roundedRect(ctx, plateX, plateY, plateWidth, plateWidth, plateWidth * 0.18);
  ctx.fill();
  ctx.drawImage(state.logoImage, logoX, logoY, logoWidth, logoWidth);
}

function renderBarcodeToCanvas(canvas, payload, width, options = {}) {
  const height = Math.max(220, Math.round(width * 0.46));
  prepareCanvas(canvas, width, height);
  const sharpness = canvas === elements.canvas ? Math.max(2, window.devicePixelRatio || 1) : 1;
  const knockOutCode = shouldKnockOutCode(options);
  JsBarcode(
    canvas,
    payload,
    barcodeOptions(width, sharpness, options, { codeColor: knockOutCode ? '#000000' : undefined })
  );
  if (knockOutCode) {
    knockOutBarcodeInk(canvas, payload, width, sharpness, options);
  }
  canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
}

function knockOutBarcodeInk(canvas, payload, width, sharpness, options = {}) {
  const maskCanvas = document.createElement('canvas');
  JsBarcode(
    maskCanvas,
    payload,
    barcodeOptions(width, sharpness, options, { background: null, codeColor: '#000000' })
  );

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();
}

function barcodeOptions(width, sharpness = 1, options = {}, overrides = {}) {
  const background = getBackgroundColor(options);
  return {
    format: state.barcodeFormat,
    lineColor: overrides.codeColor || getCodeColor(),
    background:
      overrides.background !== undefined
        ? overrides.background
        : background === 'transparent'
          ? 'rgba(255,255,255,0)'
          : background,
    width: Math.max(3, Math.round(width / 100)) * sharpness,
    height: Math.round(width * 0.23),
    margin: Math.max(8, state.margin * 4),
    displayValue: state.barcodeText,
    font: 'system-ui',
    fontSize: Math.max(16, Math.round(width * 0.035))
  };
}

function prepareCanvas(canvas, width, height) {
  const ratio = canvas === elements.canvas ? window.devicePixelRatio || 1 : 1;
  canvas.dataset.codeMode = state.mode;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.aspectRatio = `${width} / ${height}`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  return ctx;
}

function clearCanvas(width, height) {
  const ctx = prepareCanvas(elements.canvas, width, height);
  const background = getBackgroundColor();
  ctx.clearRect(0, 0, width, height);
  if (background === 'transparent') return;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
}

function getBackgroundColor(options = {}) {
  if (options.jpgFallback && state.transparentBackground) return '#ffffff';
  return state.transparentBackground ? 'transparent' : state.backgroundColor;
}

function getCodeColor() {
  return state.transparentCode ? 'rgba(255,255,255,0)' : state.dotColor;
}

function getSvgCodeColor() {
  return state.transparentCode ? 'transparent' : state.dotColor;
}

function getLogoPlateColor(options = {}) {
  if (options.jpgFallback && state.transparentBackground) return '#ffffff';
  return state.transparentBackground ? '#ffffff' : state.backgroundColor;
}

function shouldKnockOutCode(options = {}) {
  return state.transparentCode && getBackgroundColor(options) !== 'transparent';
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function buildQrSvg(payload, size) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: state.errorCorrectionLevel });
  const count = qr.modules.size;
  const tile = size / (count + state.margin * 2);
  const radius = state.dotStyle === 'rounded' ? (tile / 2) * state.roundness : 0;
  const moduleRects = [];

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const x = roundNumber((col + state.margin) * tile);
      const y = roundNumber((row + state.margin) * tile);
      const w = roundNumber(tile);
      moduleRects.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${roundNumber(radius)}"/>`
      );
    }
  }

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  ];
  if (state.transparentCode && !state.transparentBackground) {
    parts.push(
      '<defs>',
      '<mask id="qr-code-holes" maskUnits="userSpaceOnUse">',
      '<rect width="100%" height="100%" fill="white"/>',
      `<g fill="black">${moduleRects.join('')}</g>`,
      '</mask>',
      '</defs>',
      `<rect width="100%" height="100%" fill="${state.backgroundColor}" mask="url(#qr-code-holes)"/>`
    );
  } else if (!state.transparentBackground) {
    parts.push(`<rect width="100%" height="100%" fill="${state.backgroundColor}"/>`);
  }

  if (!state.transparentCode) {
    parts.push(`<g fill="${getSvgCodeColor()}">${moduleRects.join('')}</g>`);
  }

  if (state.logoDataUrl) {
    const logoWidth = size * (state.logoSize / 100);
    const padding = logoWidth * 0.18;
    const plateWidth = logoWidth + padding * 2;
    const plateX = (size - plateWidth) / 2;
    const logoX = (size - logoWidth) / 2;
    parts.push(
      `<rect x="${roundNumber(plateX)}" y="${roundNumber(plateX)}" width="${roundNumber(plateWidth)}" height="${roundNumber(plateWidth)}" rx="${roundNumber(plateWidth * 0.18)}" fill="${state.transparentBackground ? '#ffffff' : state.backgroundColor}"/>`,
      `<image href="${state.logoDataUrl}" x="${roundNumber(logoX)}" y="${roundNumber(logoX)}" width="${roundNumber(logoWidth)}" height="${roundNumber(logoWidth)}" preserveAspectRatio="xMidYMid meet"/>`
    );
  }

  parts.push('</svg>');
  return parts.join('');
}

function buildBarcodeSvg(payload) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (state.transparentCode && !state.transparentBackground) {
    JsBarcode(
      svg,
      payload,
      barcodeOptions(state.jpgSize, 1, {}, { background: null, codeColor: '#000000' })
    );
    applyBarcodeSvgKnockout(svg);
  } else {
    JsBarcode(svg, payload, barcodeOptions(state.jpgSize));
  }
  return new XMLSerializer().serializeToString(svg);
}

function applyBarcodeSvgKnockout(svg) {
  const maskId = 'barcode-code-holes';
  const children = [...svg.childNodes];
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  const fullRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  mask.setAttribute('id', maskId);
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  fullRect.setAttribute('width', '100%');
  fullRect.setAttribute('height', '100%');
  fullRect.setAttribute('fill', 'white');
  mask.append(fullRect);

  children.forEach((child) => {
    const clone = child.cloneNode(true);
    if (clone.nodeType === Node.ELEMENT_NODE) {
      clone.setAttribute('fill', 'black');
    }
    mask.append(clone);
  });

  defs.append(mask);
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', state.backgroundColor);
  background.setAttribute('mask', `url(#${maskId})`);
  svg.replaceChildren(defs, background);
}

async function downloadSvg() {
  const payload = buildPayload();
  if (!payload.trim()) return;

  const svg = state.mode === 'qr' ? buildQrSvg(payload, state.jpgSize) : buildBarcodeSvg(payload);
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename('svg'));
}

async function downloadJpg() {
  const payload = buildPayload();
  if (!payload.trim()) return;

  const exportCanvas = document.createElement('canvas');
  if (state.mode === 'qr') {
    renderQrToCanvas(exportCanvas, payload, state.jpgSize, { jpgFallback: true });
  } else {
    renderBarcodeToCanvas(exportCanvas, payload, state.jpgSize, { jpgFallback: true });
  }

  const jpgCanvas = flattenCanvasForJpg(exportCanvas);
  jpgCanvas.toBlob(
    (blob) => {
      if (blob) downloadBlob(blob, filename('jpg'));
    },
    'image/jpeg',
    0.94
  );
}

function flattenCanvasForJpg(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);
  return canvas;
}

function filename(extension) {
  const prefix = state.mode === 'qr' ? `qr-${state.type}` : `barcode-${state.barcodeFormat.toLowerCase()}`;
  return `${prefix}-${state.jpgSize}px.${extension}`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setPreviewDraggable(isDraggable) {
  elements.canvas.draggable = isDraggable;
  elements.canvas.classList.toggle('is-draggable', isDraggable);
}

function handlePreviewDragStart(event) {
  const payload = buildPayload();
  if (!payload.trim()) {
    event.preventDefault();
    return;
  }

  try {
    const dragCanvas = document.createElement('canvas');
    if (state.mode === 'qr') {
      renderQrToCanvas(dragCanvas, payload, state.jpgSize);
    } else {
      renderBarcodeToCanvas(dragCanvas, payload, state.jpgSize);
    }

    const name = filename('png');
    const dataUrl = dragCanvas.toDataURL('image/png');
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('DownloadURL', `image/png:${name}:${dataUrl}`);
    event.dataTransfer.setData('text/uri-list', dataUrl);
    event.dataTransfer.setData('text/plain', name);
    event.dataTransfer.setData('text/html', `<img src="${dataUrl}" alt="${escapeHtml(name)}">`);
    const previewRect = elements.canvas.getBoundingClientRect();
    event.dataTransfer.setDragImage(elements.canvas, previewRect.width / 2, previewRect.height / 2);

    try {
      event.dataTransfer.items.add(dataUrlToFile(dataUrl, name));
    } catch {
      // Some browsers expose DataTransferItemList but do not accept File items.
    }
  } catch (error) {
    event.preventDefault();
    setMessage(error.message || 'Unable to drag this code.');
  }
}

function dataUrlToFile(dataUrl, name) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/^data:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(data);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }
  return new File([buffer], name, { type: mime });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setMessage(text) {
  elements.message.textContent = text;
}

function roundNumber(value) {
  return Number(value.toFixed(3));
}

function syncColor(colorInput, textInput, key) {
  colorInput.addEventListener('input', () => {
    state[key] = colorInput.value;
    textInput.value = colorInput.value;
    updateCode();
  });

  textInput.addEventListener('input', () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(textInput.value)) return;
    state[key] = textInput.value;
    colorInput.value = textInput.value;
    updateCode();
  });
}

function syncSize(source) {
  const value = Math.min(4096, Math.max(256, Number(source.value) || 1024));
  state.jpgSize = value;
  elements.jpgSize.value = String(value);
  elements.jpgSizeNumber.value = String(value);
  updateCode();
}

function setMode(mode) {
  state.mode = mode;
  const isQr = mode === 'qr';
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  elements.qrTypeSection.classList.toggle('is-hidden', !isQr);
  elements.dynamicFields.classList.toggle('is-hidden', !isQr);
  elements.qrStyleSection.classList.toggle('is-hidden', !isQr);
  elements.qrLogoSection.classList.toggle('is-hidden', !isQr);
  elements.qrSettingsSection.classList.toggle('is-hidden', !isQr);
  elements.barcodeFields.classList.toggle('is-hidden', isQr);
  updateCode();
}

function setActiveButton(buttons, activeButton) {
  buttons.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function clearLogo() {
  state.logoDataUrl = '';
  state.logoImage = null;
  elements.logoFile.value = '';
  updateLogoUi();
  updateCode();
}

function updateLogoUi(name = 'No logo selected') {
  elements.logoName.textContent = name;
  elements.logoPreview.src = state.logoDataUrl;
  elements.logoPreview.classList.toggle('is-hidden', !state.logoDataUrl);
  elements.logoRemove.disabled = !state.logoDataUrl;
}

function syncBackgroundUi() {
  elements.transparentBackground.checked = state.transparentBackground;
  elements.backgroundColor.disabled = state.transparentBackground;
  elements.backgroundColorText.disabled = state.transparentBackground;
}

function syncCodeColorUi() {
  elements.transparentCode.checked = state.transparentCode;
  elements.dotColor.disabled = state.transparentCode;
  elements.dotColorText.disabled = state.transparentCode;
}

elements.modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

elements.typeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.type = button.dataset.type;
    elements.typeButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
    renderDynamicFields();
    updateCode();
  });
});

elements.barcodeValue.addEventListener('input', () => {
  state.barcodeValue = elements.barcodeValue.value;
  updateCode();
});

elements.barcodeFormat.addEventListener('change', () => {
  state.barcodeFormat = elements.barcodeFormat.value;
  updateCode();
});

elements.barcodeText.addEventListener('change', () => {
  state.barcodeText = elements.barcodeText.checked;
  updateCode();
});

elements.dotStyleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.dotStyle = button.dataset.dotStyle;
    setActiveButton(elements.dotStyleButtons, button, 'dotStyle');
    updateCode();
  });
});

elements.roundness.addEventListener('input', () => {
  state.roundness = Number(elements.roundness.value) / 100;
  updateCode();
});

elements.logoSize.addEventListener('input', () => {
  state.logoSize = Number(elements.logoSize.value) || 18;
  updateCode();
});

elements.logoFile.addEventListener('change', () => {
  const file = elements.logoFile.files?.[0];
  if (!file) {
    clearLogo();
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const image = new Image();
    image.addEventListener('load', () => {
      state.logoDataUrl = String(reader.result);
      state.logoImage = image;
      updateLogoUi(file.name);
      updateCode();
    });
    image.addEventListener('error', () => {
      clearLogo();
      setMessage('Choose a valid image file.');
    });
    image.src = String(reader.result);
  });
  reader.readAsDataURL(file);
});

elements.logoRemove.addEventListener('click', clearLogo);

elements.transparentCode.addEventListener('change', () => {
  state.transparentCode = elements.transparentCode.checked;
  syncCodeColorUi();
  updateCode();
});

elements.transparentBackground.addEventListener('change', () => {
  state.transparentBackground = elements.transparentBackground.checked;
  syncBackgroundUi();
  updateCode();
});

elements.errorLevel.addEventListener('input', () => {
  const level = errorLevels[Number(elements.errorLevel.value)] || errorLevels[3];
  state.errorCorrectionLevel = level.value;
  elements.errorLevelValue.textContent = level.label;
  updateCode();
});

elements.margin.addEventListener('input', () => {
  state.margin = Math.min(10, Math.max(0, Number(elements.margin.value) || 0));
  elements.marginValue.textContent = String(state.margin);
  updateCode();
});

elements.jpgSize.addEventListener('input', () => syncSize(elements.jpgSize));
elements.jpgSizeNumber.addEventListener('input', () => syncSize(elements.jpgSizeNumber));
elements.downloadSvg.addEventListener('click', downloadSvg);
elements.downloadJpg.addEventListener('click', downloadJpg);
elements.canvas.addEventListener('dragstart', handlePreviewDragStart);

syncColor(elements.dotColor, elements.dotColorText, 'dotColor');
syncColor(elements.backgroundColor, elements.backgroundColorText, 'backgroundColor');
syncCodeColorUi();
syncBackgroundUi();
elements.modeButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
});
elements.typeButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.dataset.type === state.type));
});
elements.dotStyleButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.dataset.dotStyle === state.dotStyle));
});
elements.errorLevelValue.textContent =
  errorLevels.find((level) => level.value === state.errorCorrectionLevel)?.label || 'High';
elements.marginValue.textContent = String(state.margin);
updateLogoUi();
renderDynamicFields();
setMode(state.mode);
