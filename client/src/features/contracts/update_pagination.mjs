import fs from 'fs';

const filePath = 'c:\\Collage\\peoplepay_odoo\\Odoo-team-96\\client\\src\\features\\contracts\\index.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add Pagination import
if (!content.includes("import { Pagination }")) {
  content = content.replace(
    "import { LoadingState } from '../../components/ui/States';",
    "import { LoadingState } from '../../components/ui/States';\nimport { Pagination } from '../../components/ui/Pagination';"
  );
}

// 2. Add pagination state
if (!content.includes("const [currentPage, setCurrentPage] = useState(1);")) {
  content = content.replace(
    "const [contractSearchTerm, setContractSearchTerm] = useState('');",
    "const [contractSearchTerm, setContractSearchTerm] = useState('');\n  const [currentPage, setCurrentPage] = useState(1);\n  const [pageSize, setPageSize] = useState(5);"
  );
}

// 3. Reset page on search or filter change
if (!content.includes("setCurrentPage(1)")) {
  content = content.replace(
    "const filteredContractsList = React.useMemo(() => {",
    "React.useEffect(() => { setCurrentPage(1); }, [contractSearchTerm, contractStatusFilter]);\n\n  const filteredContractsList = React.useMemo(() => {"
  );
}

// 4. Create paginated contracts slice
if (!content.includes("paginatedContracts")) {
  content = content.replace(
    "const allEmployees = React.useMemo(() => {",
    "const paginatedContracts = React.useMemo(() => {\n    const start = (currentPage - 1) * pageSize;\n    return filteredContractsList.slice(start, start + pageSize);\n  }, [filteredContractsList, currentPage, pageSize]);\n\n  const allEmployees = React.useMemo(() => {"
  );
}

// 5. Replace filteredContractsList.map with paginatedContracts.map
content = content.replace(
  "{filteredContractsList.map((cnt, idx) => {",
  "{paginatedContracts.map((cnt, idx) => {"
);

// 6. Replace old table footer with <Pagination />
const oldFooterRegex = /{\/\* Table Footer \*\/}[\s\S]*?<\/div>\s*<\/div>/;
const newFooter = `<Pagination
                currentPage={currentPage}
                totalRecords={filteredContractsList.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>`;

content = content.replace(oldFooterRegex, newFooter);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Successfully updated contracts/index.jsx with real-time pagination!");
