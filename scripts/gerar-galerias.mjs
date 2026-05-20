#!/usr/bin/env node
/**
 * Gera assets/data/midias.json a partir das pastas em assets/img/cursos/.
 *
 * Convenção: nome da pasta = `id` do curso. Estrutura por curso:
 *   assets/img/cursos/<curso-id>/
 *     ├── flyer.jpg              -> detalhe.flyer
 *     ├── carrossel.jpg          -> detalhe.flyerCarrossel
 *     └── fotos/                 -> detalhe.galeria.fotos (originais preservados)
 *         ├── foto-01.jpg
 *         └── ...
 *
 * Otimização de imagens (derivados ficam ao lado dos originais):
 *   - <curso-id>/flyer.jpg     → <curso-id>/flyer.webp
 *   - <curso-id>/carrossel.jpg → <curso-id>/carrossel.webp
 *   - fotos/foto-NN.jpg        → fotos/foto-NN.thumb.webp (~600px, mural)
 *                                fotos/foto-NN.webp       (~1600px, lightbox)
 *   Cache: só regenera se o original for mais novo que o derivado.
 */

import sharp from "sharp"
import { readFile, writeFile, readdir, mkdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve, relative, posix, basename, extname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..")
const CURSOS_PATH = join(ROOT, "assets", "data", "cursos.json")
const CURSOS_IMG_DIR = join(ROOT, "assets", "img", "cursos")
const OUT_PATH = join(ROOT, "assets", "data", "midias.json")
// Extensões aceitas como ORIGINAL (input). .webp fica de fora porque é o formato
// usado pelos derivados — assim listarFotos não confunde gerados com originais.
const EXT_ORIGINAL = new Set([".jpg", ".jpeg", ".png", ".gif", ".avif"])

const THUMB_WIDTH = 600
const FULL_WIDTH = 1600
const FLYER_WIDTH = 1200
const CARROSSEL_WIDTH = 1400
const THUMB_QUALITY = 72
const FULL_QUALITY = 82

function toPosix(p) {
  return p.split(/[\\/]/g).join(posix.sep)
}

function relUrl(absPath) {
  return toPosix(relative(ROOT, absPath))
}

async function stataSafe(p) {
  try { return await stat(p) } catch { return null }
}

async function precisaRegerar(destPath, srcStat) {
  const destStat = await stataSafe(destPath)
  if (!destStat) return true
  return destStat.mtimeMs < srcStat.mtimeMs
}

async function gerarWebp(srcPath, destPath, width, quality) {
  const srcStat = await stat(srcPath)
  if (!(await precisaRegerar(destPath, srcStat))) return false
  await mkdir(resolve(destPath, ".."), { recursive: true })
  await sharp(srcPath)
    .rotate() // respeita EXIF orientation
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(destPath)
  return true
}

async function processarFotoMural(srcPath) {
  // Derivados ficam ao lado do original: foto-NN.thumb.webp e foto-NN.webp
  const dir = resolve(srcPath, "..")
  const base = basename(srcPath, extname(srcPath))
  const thumbPath = join(dir, base + ".thumb.webp")
  const fullPath = join(dir, base + ".webp")
  const t1 = await gerarWebp(srcPath, thumbPath, THUMB_WIDTH, THUMB_QUALITY)
  const t2 = await gerarWebp(srcPath, fullPath, FULL_WIDTH, FULL_QUALITY)
  return { thumb: relUrl(thumbPath), full: relUrl(fullPath), regerouThumb: t1, regerouFull: t2 }
}

async function processarAvulso(srcPath, destPath, width, quality) {
  const regerou = await gerarWebp(srcPath, destPath, width, quality)
  return { url: relUrl(destPath), regerou }
}

function acharArquivoBase(dir, nomeBase) {
  if (!existsSync(dir)) return null
  for (const ext of EXT_ORIGINAL) {
    const tentativa = join(dir, nomeBase + ext)
    if (existsSync(tentativa)) return tentativa
  }
  return null
}

async function listarFotos(fotosDir) {
  if (!existsSync(fotosDir)) return []
  const arquivos = await readdir(fotosDir, { withFileTypes: true })
  return arquivos
    .filter(a => a.isFile())
    .filter(a => EXT_ORIGINAL.has("." + a.name.split(".").pop().toLowerCase()))
    .map(a => join(fotosDir, a.name))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
}

function coletarCursos(data) {
  const out = []
  for (const eixoKey of Object.keys(data.eixos || {})) {
    for (const trilha of data.eixos[eixoKey].trilhas || []) {
      for (const curso of trilha.cursos || []) out.push(curso)
    }
  }
  return out
}

async function main() {
  const t0 = Date.now()
  const data = JSON.parse(await readFile(CURSOS_PATH, "utf8"))
  const cursos = coletarCursos(data)
  const cursoPorId = new Map(cursos.map(c => [c.id, c]))

  const pastas = existsSync(CURSOS_IMG_DIR)
    ? (await readdir(CURSOS_IMG_DIR, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name)
    : []

  const midias = {}
  const semCurso = []
  let processadas = 0
  let regeradas = 0

  for (const nome of pastas) {
    if (!cursoPorId.has(nome)) {
      semCurso.push(nome)
      continue
    }
    const cursoDir = join(CURSOS_IMG_DIR, nome)
    const entrada = {}

    // Flyer — gera flyer.webp ao lado de flyer.jpg
    const flyer = acharArquivoBase(cursoDir, "flyer")
    if (flyer) {
      const dest = join(cursoDir, "flyer.webp")
      const r = await processarAvulso(flyer, dest, FLYER_WIDTH, FULL_QUALITY)
      entrada.flyer = r.url
      processadas++
      if (r.regerou) regeradas++
    }

    // Carrossel — gera carrossel.webp ao lado de carrossel.jpg
    const carrossel = acharArquivoBase(cursoDir, "carrossel")
    if (carrossel) {
      const dest = join(cursoDir, "carrossel.webp")
      const r = await processarAvulso(carrossel, dest, CARROSSEL_WIDTH, FULL_QUALITY)
      entrada.flyerCarrossel = r.url
      processadas++
      if (r.regerou) regeradas++
    }

    // Fotos do mural — derivados ao lado de cada foto
    const fotosSrc = await listarFotos(join(cursoDir, "fotos"))
    if (fotosSrc.length) {
      const curso = cursoPorId.get(nome)
      const fotos = []
      for (let i = 0; i < fotosSrc.length; i++) {
        const src = fotosSrc[i]
        const r = await processarFotoMural(src)
        fotos.push({
          src: relUrl(src),         // original (fallback / referência)
          thumb: r.thumb,           // mural (600px webp)
          full: r.full,             // lightbox (1600px webp)
          alt: basename(src, extname(src)).replace(/[-_]/g, " ")
        })
        processadas += 2
        if (r.regerouThumb) regeradas++
        if (r.regerouFull) regeradas++
        if ((i + 1) % 20 === 0) console.log(`  ... ${i + 1}/${fotosSrc.length} fotos do mural`)
      }
      entrada.galeria = {
        titulo: "Registros do evento",
        descricao: curso.detalhe?.dataExtenso
          ? `Fotos da realização em ${curso.detalhe.dataExtenso}.`
          : "Fotos da realização do evento.",
        fotos
      }
    }

    if (Object.keys(entrada).length) {
      midias[nome] = entrada
      const partes = []
      if (entrada.flyer) partes.push("flyer")
      if (entrada.flyerCarrossel) partes.push("carrossel")
      if (entrada.galeria) partes.push(`${entrada.galeria.fotos.length} fotos`)
      console.log(`[midias] ${nome}: ${partes.join(", ")}`)
    }
  }

  if (semCurso.length) {
    console.warn(`[midias] Pastas sem curso correspondente em cursos.json: ${semCurso.join(", ")}`)
  }

  await writeFile(OUT_PATH, JSON.stringify(midias, null, 2) + "\n", "utf8")
  const dur = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(
    `[midias] gerado em ${relUrl(OUT_PATH)} — ${Object.keys(midias).length} curso(s). ` +
    `${processadas} imagens (${regeradas} regeradas, ${processadas - regeradas} em cache). Levou ${dur}s.`
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
