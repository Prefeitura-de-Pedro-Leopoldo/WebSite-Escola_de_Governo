#!/usr/bin/env node
/**
 * Gera assets/data/midias.json a partir das pastas em assets/img/cursos/.
 *
 * Convenção: nome da pasta = `id` do curso. Estrutura por curso:
 *   assets/img/cursos/<curso-id>/
 *     ├── flyer.jpg         -> mapeado para detalhe.flyer
 *     ├── carrossel.jpg     -> mapeado para detalhe.flyerCarrossel
 *     └── fotos/            -> mapeado para detalhe.galeria
 *         ├── foto-01.jpg
 *         └── foto-02.jpg
 *
 * Basta jogar arquivos nas pastas certas — nada precisa ser editado à mão.
 */

import { readFile, writeFile, readdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join, resolve, relative, posix } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..")
const CURSOS_PATH = join(ROOT, "assets", "data", "cursos.json")
const CURSOS_IMG_DIR = join(ROOT, "assets", "img", "cursos")
const OUT_PATH = join(ROOT, "assets", "data", "midias.json")
const EXT_IMG = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"])

function toPosix(p) {
  return p.split(/[\\/]/g).join(posix.sep)
}

function relUrl(absPath) {
  return toPosix(relative(ROOT, absPath))
}

function acharArquivoBase(dir, nomeBase) {
  if (!existsSync(dir)) return null
  for (const ext of EXT_IMG) {
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
    .filter(a => EXT_IMG.has("." + a.name.split(".").pop().toLowerCase()))
    .map(a => ({
      src: relUrl(join(fotosDir, a.name)),
      alt: a.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
    }))
    .sort((a, b) => a.src.localeCompare(b.src, "pt-BR", { numeric: true, sensitivity: "base" }))
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
  const data = JSON.parse(await readFile(CURSOS_PATH, "utf8"))
  const cursos = coletarCursos(data)
  const cursoPorId = new Map(cursos.map(c => [c.id, c]))

  const pastas = existsSync(CURSOS_IMG_DIR)
    ? (await readdir(CURSOS_IMG_DIR, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name)
    : []

  const midias = {}
  const semCurso = []

  for (const nome of pastas) {
    if (!cursoPorId.has(nome)) {
      semCurso.push(nome)
      continue
    }
    const cursoDir = join(CURSOS_IMG_DIR, nome)
    const entrada = {}

    const flyer = acharArquivoBase(cursoDir, "flyer")
    if (flyer) entrada.flyer = relUrl(flyer)

    const carrossel = acharArquivoBase(cursoDir, "carrossel")
    if (carrossel) entrada.flyerCarrossel = relUrl(carrossel)

    const fotos = await listarFotos(join(cursoDir, "fotos"))
    if (fotos.length) {
      const curso = cursoPorId.get(nome)
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
  console.log(`[midias] gerado em ${relUrl(OUT_PATH)} — ${Object.keys(midias).length} curso(s).`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
