// js/scripts.js

// ---------------------- NAV / HAMBURGER ----------------------
document.addEventListener('DOMContentLoaded', () => {
  // Toggle do menu (mobile)
  const hamburger = document.getElementById('hamburger') || document.getElementById('hamburger2')
  const nav = document.getElementById('mainNav')
  if(hamburger){
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open')
    })
  }

  // Dark mode toggle (persistente)
  const themeBtns = document.querySelectorAll('#themeToggle, #themeToggle2')
  themeBtns.forEach(btn=>{
    btn?.addEventListener('click', () => {
      document.body.classList.toggle('dark')
      // persistência simples
      const isDark = document.body.classList.contains('dark')
      localStorage.setItem('themeDark', isDark ? '1' : '0')
    })
  })
  if(localStorage.getItem('themeDark') === '1') document.body.classList.add('dark')

  // Inicializa simuladores se estiver na página correta
  if(document.getElementById('calcCdb')) initSimuladores()
})

// ---------------------- CÁLCULOS ----------------------
/**
 * Cálculo de juros compostos:
 * montante = P * (1 + r/n)^(n*t)
 * onde r é a taxa anual (decimal), n é capitalizações por ano, t é tempo em anos.
 */
function calcCompound(principal, annualPct, years, compPerYear){
  const r = annualPct / 100
  const n = Number(compPerYear)
  const amount = principal * Math.pow(1 + r / n, n * years)
  return amount
}

/**
 * Calcula IR sobre rendimento bruto segundo tabela tradicional brasileira:
 * até 180 dias: 22.5%
 * 181 a 360: 20%
 * 361 a 720: 17.5%
 * >720: 15%
 *
 * Nota: estas são taxas de exemplo. Confirme sempre as regras vigentes.
 */
function calcIRTax(grossProfit, days){
  let rate = 0.15
  if(days <= 180) rate = 0.225
  else if(days <= 360) rate = 0.20
  else if(days <= 720) rate = 0.175
  else rate = 0.15

  const tax = grossProfit * rate
  return { tax, rate }
}

// ---------------------- INICIALIZAÇÃO DA PÁGINA DE SIMULADORES ----------------------
function initSimuladores(){
  // Botão calcular CDB
  document.getElementById('calcCdb').addEventListener('click', () => {
    const P = Number(document.getElementById('cdbPrincipal').value) || 0
    const rate = Number(document.getElementById('cdbRate').value) || 0
    const years = Number(document.getElementById('cdbYears').value) || 0
    const freq = Number(document.getElementById('cdbFreq').value) || 12
    const applyIr = document.getElementById('applyIr').value === 'yes'

    const amount = calcCompound(P, rate, years, freq)
    const grossProfit = amount - P
    const days = Math.round(years * 365)

    let tax = 0
    let irRate = 0
    if(applyIr){
      const t = calcIRTax(grossProfit, days)
      tax = t.tax
      irRate = t.rate
    }

    const netProfit = grossProfit - tax
    const finalAmountNet = P + netProfit

    // Mostrar resultados
    const html = `
      <h3>Resultado</h3>
      <p>Montante bruto: R$ ${amount.toFixed(2)}</p>
      <p>Rendimento bruto: R$ ${grossProfit.toFixed(2)}</p>
      <p>Imposto estimado (${(irRate*100).toFixed(2)}%): R$ ${tax.toFixed(2)}</p>
      <p><strong>Rendimento líquido: R$ ${netProfit.toFixed(2)}</strong></p>
      <p><strong>Montante líquido: R$ ${finalAmountNet.toFixed(2)}</strong></p>
    `
    document.getElementById('cdbResults').innerHTML = html

    // Atualiza gráfico
    updateCdbChart(P, rate, years, freq, applyIr ? (1 - irRate) : 1)
  })

  // Botão calcular IR simples
  document.getElementById('calcIr').addEventListener('click', () => {
    const gross = Number(document.getElementById('irGross').value) || 0
    const days = Number(document.getElementById('irDays').value) || 0
    const result = calcIRTax(gross, days)
    const html = `<p>Taxa aplicada: ${(result.rate*100).toFixed(2)}%</p>
                  <p>IR devido: R$ ${result.tax.toFixed(2)}</p>
                  <p>Rendimento líquido: R$ ${(gross - result.tax).toFixed(2)}</p>`
    document.getElementById('irResults').innerHTML = html
  })

  // Salvar simulação localmente
  document.getElementById('saveSim').addEventListener('click', () => {
    const P = Number(document.getElementById('cdbPrincipal').value) || 0
    const rate = Number(document.getElementById('cdbRate').value) || 0
    const years = Number(document.getElementById('cdbYears').value) || 0
    const key = 'simulations'
    const arr = JSON.parse(localStorage.getItem(key) || '[]')
    arr.push({principal:P,rate,years,date:new Date().toISOString()})
    localStorage.setItem(key, JSON.stringify(arr))
    alert('Simulação salva no localStorage!')
  })
}

// ---------------------- GRÁFICO (Chart.js) ----------------------
let cdbChart = null
function updateCdbChart(principal, annualPct, years, compPerYear, netFactor = 1){
  // Gera dados mensais (ou por período) para o eixo X/Y
  const months = Math.round(years * 12)
  const labels = []
  const data = []
  for(let i = 0; i <= months; i++){
    const tYears = i / 12
    const amt = calcCompound(principal, annualPct, tYears, compPerYear)
    // aplica fator líquido (ex: 0.85 se houver IR)
    data.push((amt * netFactor).toFixed(2))
    labels.push(`${i}m`)
  }

  const ctx = document.getElementById('cdbChart').getContext('2d')
  if(cdbChart) cdbChart.destroy()
  cdbChart = new Chart(ctx, {
    type: 'line',
    data:{
      labels,
      datasets:[{
        label:'Saldo acumulado (R$)',
        data,
        fill:true,
        tension:0.3
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:true}}
    }
  })
}
