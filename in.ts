import { Graph } from './gr'

interface ICountry {
    name: {
        common: string
        official: string
        nativeName: {
            ell: {
                official: string
                common: string
            }
            tur: {
                official: string
                common: string
            }
        }
    }
    cca3: string
    borders: string[]
    area: number
}

async function getDataAsync(url: string): Promise<unknown> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    })

    if (response.ok) {
        return response.json()
    }
    const error = {
        status: response.status,
        customError: 'wtfAsync',
    }
    throw error
}

function getDataPromise(url: string): Promise<unknown> {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
    }).then((response) => {
        if (response.ok) {
            return response.json()
        }
        return Promise.reject({
            status: response.status,
            customError: 'wtfPromise',
        })
    })
}



const getData: (url: string) => Promise<any> = getDataAsync || getDataPromise

async function loadCountriesData(): Promise<{ [cca3: string]: ICountry }> {
    let countries: ICountry[]
    try {
        countries = await getData('https://restcountries.com/v3.1/all?fields=name&fields=cca3&fields=borders')
    } catch (error) {
        throw error
    }
    return countries.reduce((result, country) => {
        result[country.cca3] = country
        if (country.borders == null) {
            country.borders = []
        }

        return result
    }, {})
}

function findPath(countriesGraph: { [key: string]: { [key: string]: number } }, fromCountry: string, toCountry: string) {
    const graph: Graph = new Graph(countriesGraph)
    return graph.findShortestPath(fromCountry, toCountry)
}

function createCountriesGraph(countriesData: { [cca3: string]: ICountry }): { [key: string]: { [key: string]: number } } {
    const map: { [key: string]: { [key: string]: number } } = {}
    Object.entries(countriesData).forEach((keyVal) => {
        const borders = {}
        keyVal[1].borders.forEach((border) => {
            borders[border] = 1
        })
        map[keyVal[0]] = borders
    })
    return map
}

function mapCountryNamesToCountryCode(countriesData: { [cca3: string]: ICountry }): { [key: string]: string } {
    const nameToCode: { [key: string]: string } = {}
    Object.entries(countriesData).forEach((keyVal) => {
        nameToCode[keyVal[1].name.common] = keyVal[0]
    })

    return nameToCode
}

const form = document.getElementById('form') as HTMLFormElement
const fromCountry = document.getElementById('fromCountry') as HTMLInputElement;;
const toCountry = document.getElementById('toCountry') as HTMLInputElement;;
const countriesList = document.getElementById('countriesList') as HTMLDataListElement
const submit = document.getElementById('submit') as HTMLButtonElement
const output = document.getElementById('output') as HTMLDivElement;

(async () => {

    fromCountry.disabled = true
    toCountry.disabled = true

    submit.disabled = true
    output.textContent = 'Loading…'

    let countriesData: { [cca3: string]: ICountry } = {}
    let countriesGraph: { [key: string]: { [key: string]: number } } = {}
    let nameToCode: { [key: string]: string } = {}

    try {
        countriesData = await loadCountriesData()
        nameToCode = mapCountryNamesToCountryCode(countriesData)
        countriesGraph = createCountriesGraph(countriesData)
    } catch (error) {
        output.innerHTML = 'Something went wrong. Try to reset your computer.'
        return
    }
    output.innerHTML = ''

    // Заполняем список стран для подсказки в инпутах
    Object.keys(countriesData)
        .sort((a, b) => countriesData[b].area - countriesData[a].area)
        .forEach((code) => {
            const option = document.createElement('option')
            option.value = countriesData[code].name.common
            option.label = code
            countriesList.appendChild(option)
        })

    fromCountry.disabled = false
    toCountry.disabled = false
    submit.disabled = false

    form.addEventListener('submit', (event) => {
        event.preventDefault()

        output.innerHTML = 'Идет расчет...'
        const path = findPath(countriesGraph, nameToCode[fromCountry.value], nameToCode[toCountry.value])
        if (path == null) {
            output.innerHTML = 'Путь не найден'
            return
        }

        const pathAsString = path
            .map((countryCode) => {
                return countriesData[countryCode].name.common
            })
            .join(' -> ')
        output.innerHTML = `${pathAsString}<br>Все данные можно получить за 1 запрос 🤭`
    })
})()
