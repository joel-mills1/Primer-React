import {render, screen, waitFor} from '@testing-library/react'
import React from 'react'
import {ThemeProvider, Text, useTheme} from '..'
import 'jest-styled-components'

// window.matchMedia() is not implmented by JSDOM so we have to create a mock:
// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

const exampleTheme = {
  colors: {
    text: '#f00'
  },
  colorSchemes: {
    light: {
      colors: {
        text: 'black'
      }
    },
    dark: {
      colors: {
        text: 'white'
      }
    },
    dark_dimmed: {
      colors: {
        text: 'gray'
      }
    }
  }
}

it('respects theme prop', () => {
  const theme = {
    colors: {
      text: '#f00'
    },
    space: ['0', '0.25rem']
  }

  render(
    <ThemeProvider theme={theme}>
      <Text color="text" mb={1}>
        Hello
      </Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', '#f00')
  expect(screen.getByText('Hello')).toHaveStyleRule('margin-bottom', '0.25rem')
})

it('has default theme', () => {
  render(
    <ThemeProvider>
      <Text color="text.primary" mb={1}>
        Hello
      </Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toMatchSnapshot()
})

it('inherits theme from parent', () => {
  render(
    <ThemeProvider theme={exampleTheme}>
      <ThemeProvider>
        <Text color="text">Hello</Text>
      </ThemeProvider>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'black')
})

it('defaults to light color scheme', () => {
  render(
    <ThemeProvider theme={exampleTheme}>
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'black')
})

it('defaults to dark color scheme in night mode', () => {
  render(
    <ThemeProvider theme={exampleTheme} colorMode="night">
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'white')
})

it('respects nightScheme prop', () => {
  render(
    <ThemeProvider theme={exampleTheme} colorMode="night" nightScheme="dark_dimmed">
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'gray')
})

it('respects dayScheme prop', () => {
  render(
    <ThemeProvider theme={exampleTheme} colorMode="day" dayScheme="dark" nightScheme="dark_dimmed">
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'white')
})

it('works in auto mode', () => {
  render(
    <ThemeProvider theme={exampleTheme} colorMode="auto">
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'black')
})

it('works in auto mode (dark)', () => {
  const matchMediaSpy = jest.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: true, // enable dark mode
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))

  render(
    <ThemeProvider theme={exampleTheme} colorMode="auto">
      <Text color="text">Hello</Text>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'white')

  matchMediaSpy.mockRestore()
})

it('updates when colorMode prop changes', async () => {
  function App() {
    const [colorMode, setColorMode] = React.useState<'day' | 'night'>('day')
    return (
      <ThemeProvider theme={exampleTheme} colorMode={colorMode}>
        <Text color="text">{colorMode}</Text>
        <button onClick={() => setColorMode(colorMode === 'day' ? 'night' : 'day')}>Toggle</button>
      </ThemeProvider>
    )
  }

  render(<App />)

  // starts in day mode (light scheme)
  expect(screen.getByText('day')).toHaveStyleRule('color', 'black')

  screen.getByRole('button').click()

  await waitFor(() =>
    // clicking the toggle button enables night mode (dark scheme)
    expect(screen.getByText('night')).toHaveStyleRule('color', 'white')
  )
})

it('inherits colorMode from parent', () => {
  render(
    <ThemeProvider theme={exampleTheme} colorMode="night">
      <ThemeProvider>
        <Text color="text">Hello</Text>
      </ThemeProvider>
    </ThemeProvider>
  )

  expect(screen.getByText('Hello')).toHaveStyleRule('color', 'white')
})

describe('setColorMode', () => {
  it('changes the color mode', () => {
    function ToggleMode() {
      const {colorMode, setColorMode} = useTheme()
      return <button onClick={() => setColorMode(colorMode === 'day' ? 'night' : 'day')}>Toggle</button>
    }

    render(
      <ThemeProvider theme={exampleTheme} colorMode="day">
        <Text color="text">Hello</Text>
        <ToggleMode />
      </ThemeProvider>
    )

    // starts in day mode (light scheme)
    expect(screen.getByText('Hello')).toHaveStyleRule('color', 'black')

    screen.getByRole('button').click()

    // clicking the toggle button enables night mode (dark scheme)
    expect(screen.getByText('Hello')).toHaveStyleRule('color', 'white')
  })
})
