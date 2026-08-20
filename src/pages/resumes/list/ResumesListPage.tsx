import { useNavigate } from 'react-router-dom'
import { FileAddIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Heading1,
  Heading3,
  SearchInput,
  Subheading,
} from '../../../components/ui'
import type { Resume } from '../../../db/db'
import { createResume } from '../../../db/resume'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useResumeTable } from '../../../hooks/useResumeTable'
import { ResumesTable } from './components/ResumesTable'

export default function ResumesListPage() {
  const table = useResumeTable()
  const navigate = useNavigate()

  usePageTitle('Resumes')

  const goToCreate = () => navigate('/resumes/create')

  const handleDuplicate = async (resume: Resume) => {
    await createResume(`Copy of ${resume.title}`, resume.sections)
  }

  return (
    <section className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-1">
          <Heading1>Resumes</Heading1>
          <Subheading>All your resumes in one place.</Subheading>
        </div>
      </header>

      {table.isLoading ? (
        <LoadingState />
      ) : table.totalCount > 0 || table.query !== '' ? (
        <>
          <Toolbar
            query={table.query}
            onQueryChange={table.setQuery}
            onCreateResume={goToCreate}
          />
          {table.totalCount > 0 ? (
            <ResumesTable
              resumes={table.pageItems ?? []}
              page={table.page}
              perPage={table.perPage}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              onPageChange={table.setPage}
              onPerPageChange={table.setPerPage}
              onDuplicate={handleDuplicate}
            />
          ) : (
            <NoResults query={table.query} />
          )}
        </>
      ) : (
        <EmptyState onCreateResume={goToCreate} />
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-12">
      <div className="mx-auto h-4 w-40 animate-pulse rounded bg-gray-200" />
    </div>
  )
}

type ToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  onCreateResume: () => void
}

function Toolbar(props: Readonly<ToolbarProps>) {
  const { query, onQueryChange, onCreateResume } = props

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        placeholder="Search resumes"
      />
      <Button intent="secondary" icon={FileAddIcon} onClick={onCreateResume}>
        New resume
      </Button>
    </div>
  )
}

type NoResultsProps = {
  query: string
}

function NoResults(props: Readonly<NoResultsProps>) {
  const { query } = props

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsoX />

      <Heading3>No matches</Heading3>
      <Subheading>No resumes match "{query}".</Subheading>
    </div>
  )
}

type EmptyStateProps = {
  onCreateResume: () => void
}

function EmptyState(props: Readonly<EmptyStateProps>) {
  const { onCreateResume } = props

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <IsoLibrary />
      <Heading3>No resumes yet</Heading3>
      <Subheading>Create your first resume to get started.</Subheading>
      <Button icon={FileAddIcon} onClick={onCreateResume}>
        Create your first resume
      </Button>
    </div>
  )
}

interface IsoXProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  fillColor?: string
  className?: string
}

function IsoX(props: Readonly<IsoXProps>) {
  const { size = 96, fillColor = '#F5F5F5', className = '', ...rest } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 108 121"
      fill={fillColor}
      xmlns="http://www.w3.org/2000/svg"
      className={`stroke-neutral-900 stroke-[0.5px] stroke-round join-round ${className}`}
      {...rest}
    >
      <path
        d="M81.7651 68.99C80.2851 64.19 78.4351 59.54 76.2251 55.03C75.2151 52.94 74.1151 50.89 72.9451 48.86C72.1851 47.55 71.3951 46.26 70.5751 44.99C67.4151 40.06 63.8351 35.46 59.8451 31.18C54.8251 25.8 49.4651 21.46 43.7551 18.16C38.0451 14.87 32.6851 13.01 27.6651 12.6C27.4851 12.58 27.3051 12.57 27.1251 12.56C22.9251 12.29 19.1851 12.92 15.9251 14.45C15.4651 14.67 15.0051 14.91 14.5651 15.16C10.8551 17.27 7.91515 20.59 5.74515 25.1C3.58515 29.61 2.49512 35.14 2.49512 41.68C2.49512 48.22 3.58515 55.01 5.74515 62.02C7.91515 69.03 10.8551 75.74 14.5651 82.15C18.2751 88.55 22.6451 94.45 27.6651 99.83C32.6851 105.21 38.0451 109.55 43.7551 112.85C49.4651 116.14 54.8251 118 59.8451 118.41C64.3351 118.78 68.3151 118.13 71.7551 116.48C72.1651 116.28 72.5551 116.07 72.9451 115.85C75.9151 114.15 78.3951 111.69 80.3851 108.45C80.8751 107.65 81.3351 106.8 81.7651 105.91C83.9251 101.4 85.0151 95.87 85.0151 89.32C85.0151 82.77 83.9251 76 81.7651 68.99ZM49.5851 68.92L49.7151 69.15L61.4951 89.48C62.2551 90.78 62.6251 92.1 62.6251 93.45C62.6251 94.8 62.2551 95.67 61.4951 96.1C60.7351 96.54 59.7751 96.41 58.6051 95.74C57.4351 95.06 56.4751 94.07 55.7151 92.77L43.7551 72.13L36.9351 76.02L31.7851 78.95C31.0351 79.39 30.0751 79.26 28.9051 78.59C27.7351 77.91 26.7751 76.92 26.0151 75.62C25.2551 74.31 24.8751 72.99 24.8751 71.65C24.8751 70.31 25.2551 69.42 26.0151 68.99L31.2851 65.98L37.9751 62.17L26.0151 41.53C25.2551 40.23 24.8751 38.91 24.8751 37.56C24.8751 36.21 25.2551 35.34 26.0151 34.9C26.7751 34.47 27.7351 34.6 28.9051 35.27C30.0751 35.95 31.0351 36.94 31.7851 38.24L43.7551 58.88L55.7151 52.06C56.2451 51.75 56.8651 51.72 57.5951 51.96C57.7051 51.99 57.8151 52.03 57.9251 52.09C58.1451 52.17 58.3651 52.28 58.6051 52.42C59.7751 53.1 60.7351 54.09 61.4951 55.39C62.2551 56.69 62.6251 58.02 62.6251 59.36C62.6251 60.7 62.2551 61.59 61.4951 62.02L49.5351 68.84L49.5851 68.92Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M57.975 52.17L37.975 62.17L26.015 41.53C25.255 40.23 24.875 38.91 24.875 37.56C24.875 36.21 25.255 35.34 26.015 34.9C26.775 34.47 27.735 34.6 28.905 35.27C30.075 35.95 31.035 36.94 31.785 38.24L43.755 58.88L57.595 51.96C57.705 51.99 57.815 52.03 57.925 52.09L57.975 52.17Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M62.6251 93.45C62.6251 94.79 62.2552 95.67 61.4952 96.1C60.7352 96.54 59.7752 96.41 58.6052 95.74C57.4352 95.06 56.4751 94.07 55.7151 92.77L43.7551 72.13L49.7151 69.15L61.4952 89.48C62.2552 90.78 62.6251 92.1 62.6251 93.45Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M49.585 68.92L49.715 69.15L43.755 72.13L36.935 76.02L31.785 78.95C31.035 79.39 30.075 79.26 28.905 78.59C27.735 77.91 26.775 76.92 26.015 75.62C25.255 74.31 24.875 72.99 24.875 71.65C24.875 70.31 25.255 69.42 26.015 68.99L31.285 65.98L37.975 62.17L57.975 52.17L46.015 58.99C45.255 59.42 44.875 60.31 44.875 61.65C44.875 62.99 45.255 64.31 46.015 65.62C46.775 66.92 47.735 67.91 48.905 68.59C49.145 68.73 49.365 68.84 49.585 68.92Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M105.015 79.32C105.015 85.87 103.925 91.4 101.765 95.91C99.595 100.42 96.655 103.73 92.945 105.85C92.715 105.98 92.475 106.11 92.235 106.24L92.0551 106.33L71.755 116.48C72.165 116.28 72.555 116.07 72.945 115.85C75.915 114.15 78.395 111.69 80.385 108.45C80.875 107.65 81.335 106.8 81.765 105.91C83.925 101.4 85.015 95.87 85.015 89.32C85.015 82.77 83.925 76 81.765 68.99C80.285 64.19 78.435 59.54 76.225 55.03C75.215 52.94 74.115 50.89 72.945 48.86C72.185 47.55 71.395 46.26 70.575 44.99C67.415 40.06 63.835 35.46 59.845 31.18C54.825 25.8 49.465 21.46 43.755 18.16C38.045 14.87 32.685 13.01 27.665 12.6C27.485 12.58 27.305 12.57 27.125 12.56C22.925 12.29 19.185 12.92 15.925 14.45L34.565 5.16C38.275 3.04 42.645 2.19 47.665 2.6C52.685 3.01 58.045 4.87 63.755 8.16C69.465 11.46 74.825 15.8 79.845 21.18C84.865 26.56 89.235 32.46 92.945 38.86C96.655 45.27 99.595 51.97 101.765 58.99C103.925 66 105.015 72.78 105.015 79.32Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M57.5952 51.96L43.7551 58.88L55.7151 52.06C56.2451 51.75 56.8652 51.72 57.5952 51.96Z"
        className="stroke-inherit join-inherit"
      />
    </svg>
  )
}

interface IsoLibraryProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
  fillColor?: string
  className?: string
}

function IsoLibrary(props: Readonly<IsoLibraryProps>) {
  const { size = 96, fillColor = '#F5F5F5', className = '', ...rest } = props

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 89 107"
      fill={fillColor}
      xmlns="http://www.w3.org/2000/svg"
      className={`stroke-neutral-900 stroke-[0.5px] stroke-round join-round ${className}`}
      {...rest}
    >
      <path
        d="M53.7899 101.93C53.7899 102.98 53.4799 103.68 52.8599 104.03C52.2399 104.38 51.4699 104.29 50.5599 103.77L8.61993 79.5502C6.83993 78.5302 5.31994 76.9202 4.05994 74.7402C2.79994 72.5602 2.15991 70.4602 2.15991 68.4202V20.2902C2.15991 19.2402 2.46997 18.5402 3.08997 18.1902L3.27997 18.1002C3.86997 17.8502 4.56995 17.9702 5.38995 18.4502C6.29995 18.9802 7.06994 19.7702 7.68994 20.8402C8.30994 21.9102 8.61993 22.9702 8.61993 24.0202V72.1502L50.5599 96.3602C51.4699 96.8902 52.2399 97.6902 52.8599 98.7502C53.4799 99.8202 53.7899 100.88 53.7899 101.93Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M73.7899 91.9303C73.7899 92.9803 73.4799 93.6803 72.8599 94.0303L72.6699 94.1203L52.8599 104.03C53.4799 103.68 53.7899 102.98 53.7899 101.93C53.7899 100.88 53.4799 99.8203 52.8599 98.7503C52.2399 97.6903 51.4699 96.8903 50.5599 96.3603L8.61987 72.1503L17.2399 67.8403C18.4399 69.7903 19.8699 71.2403 21.5199 72.1903L60.2399 94.5503C62.0099 95.5703 63.5299 95.7203 64.7999 95.0003L69.0299 92.8903L73.6199 90.5903C73.7299 91.0403 73.7899 91.4903 73.7899 91.9303Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M25.23 8.36989L22.17 9.88989L17.36 12.2999L16.96 12.4999C15.7 13.2199 15.07 14.5999 15.07 16.6299V61.0599C15.07 63.0999 15.7 65.2099 16.96 67.3899C17.05 67.5399 17.14 67.6899 17.24 67.8399L8.62 72.1499V24.0199C8.62 22.9699 8.31 21.9099 7.69 20.8399C7.07 19.7699 6.30001 18.9799 5.39001 18.4499C4.57001 17.9699 3.87003 17.8499 3.28003 18.0999L23.09 8.18989C23.67 7.84989 24.39 7.90989 25.23 8.36989Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M66.14 43.08C65.83 42.1 65.3799 41.11 64.7999 40.11C64.5799 39.73 64.3499 39.37 64.1099 39.03C62.9999 37.39 61.6999 36.15 60.2399 35.31L57.65 33.81L35.0699 20.77L28.6199 17.05L22.1599 13.32L21.52 12.95C19.93 12.04 18.5499 11.82 17.3599 12.3L16.96 12.5C15.7 13.22 15.0699 14.6 15.0699 16.63V61.06C15.0699 63.1 15.7 65.21 16.96 67.39C17.05 67.54 17.1399 67.69 17.2399 67.84C18.4399 69.79 19.87 71.24 21.52 72.19L60.2399 94.55C62.0099 95.57 63.5299 95.72 64.7999 95C65.9199 94.36 66.5399 93.2 66.6599 91.52C66.6799 91.31 66.6899 91.1 66.6899 90.87V46.44C66.6899 45.34 66.51 44.22 66.14 43.08ZM52.8599 63.3C52.2399 63.66 51.4699 63.57 50.5599 63.04L44.1099 59.32V66.72C44.1099 67.77 43.7999 68.47 43.1799 68.82C42.5599 69.18 41.7999 69.09 40.8799 68.56C39.9699 68.03 39.2 67.23 38.58 66.17C37.96 65.1 37.65 64.04 37.65 62.99V55.59L35.6199 54.42L31.2 51.86C30.29 51.34 29.52 50.54 28.9 49.47C28.8 49.3 28.7099 49.12 28.6199 48.95C28.1899 48.06 27.9799 47.18 27.9799 46.3C27.9799 45.42 28.1899 44.79 28.6199 44.41C28.6999 44.32 28.8 44.26 28.9 44.2C29.52 43.84 30.29 43.93 31.2 44.46L35.0699 46.7L37.65 48.19V40.78C37.65 39.73 37.96 39.03 38.58 38.68C39.2 38.33 39.9699 38.41 40.8799 38.94C41.7999 39.47 42.5599 40.27 43.1799 41.33C43.7999 42.4 44.1099 43.46 44.1099 44.51V51.91L44.53 52.15L50.5599 55.64C50.6999 55.72 50.83 55.8 50.96 55.9C51.7 56.41 52.3299 57.12 52.8599 58.03C53.4799 59.09 53.7899 60.15 53.7899 61.2C53.7899 62.25 53.4799 62.95 52.8599 63.3Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M86.6899 36.4401V80.8701C86.6899 82.9001 86.0599 84.2801 84.7999 85.0001L84.3999 85.2001L73.6199 90.5901L69.0299 92.8901L64.7999 95.0001C65.9199 94.3601 66.5399 93.2001 66.6599 91.5201C66.6799 91.3101 66.6899 91.1001 66.6899 90.8701V46.4401C66.6899 45.3401 66.5099 44.2201 66.1399 43.0801C65.8299 42.1001 65.3799 41.1101 64.7999 40.1101C64.5799 39.7301 64.3499 39.3701 64.1099 39.0301C62.9999 37.3901 61.6999 36.1501 60.2399 35.3101L57.6499 33.8101L35.0699 20.7701L28.6199 17.0501L22.1599 13.3201L21.5199 12.9501C19.9299 12.0401 18.5499 11.8201 17.3599 12.3001L22.1699 9.89012L25.2299 8.37012L36.9599 2.50012C38.2299 1.78012 39.7499 1.93012 41.5199 2.95012L80.2399 25.3101C82.0099 26.3301 83.5299 27.9301 84.7999 30.1101C86.0599 32.2901 86.6899 34.4001 86.6899 36.4401Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M53.7899 61.1999C53.7899 62.2499 53.4799 62.9499 52.8599 63.2999C52.2399 63.6599 51.4699 63.5699 50.5599 63.0399L44.1099 59.3199L50.9599 55.8999C51.6999 56.4099 52.3299 57.1199 52.8599 58.0299C53.4799 59.0899 53.7899 60.1499 53.7899 61.1999Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M50.9599 55.8999L44.1099 59.3199V66.7199C44.1099 67.7699 43.7999 68.4699 43.1799 68.8199C42.5599 69.1799 41.7999 69.0899 40.8799 68.5599C39.9699 68.0299 39.1999 67.2299 38.5799 66.1699C37.9599 65.0999 37.6499 64.0399 37.6499 62.9899V55.5899L44.5299 52.1499L50.5599 55.6399C50.6999 55.7199 50.8299 55.7999 50.9599 55.8999Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M44.53 52.15L37.65 55.59L35.62 54.42L31.2 51.86C30.29 51.34 29.52 50.54 28.9 49.47C28.8 49.3 28.71 49.12 28.62 48.95C28.19 48.06 27.98 47.18 27.98 46.3C27.98 45.42 28.19 44.79 28.62 44.41C28.7 44.32 28.8 44.26 28.9 44.2C29.52 43.84 30.29 43.93 31.2 44.46L35.07 46.7L37.65 48.19L44.11 44.96V51.91L44.53 52.15Z"
        className="stroke-inherit join-inherit"
      />
      <path
        d="M44.1099 44.5101V44.9601L37.6499 48.1901V40.7801C37.6499 39.7301 37.9599 39.0301 38.5799 38.6801C39.1999 38.3301 39.9699 38.4101 40.8799 38.9401C41.7999 39.4701 42.5599 40.2701 43.1799 41.3301C43.7999 42.4001 44.1099 43.4601 44.1099 44.5101Z"
        className="stroke-inherit join-inherit"
      />
    </svg>
  )
}
