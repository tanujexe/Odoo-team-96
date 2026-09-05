import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/features/employees/index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import Pagination
if (!content.includes("import { Pagination }")) {
  content = content.replace(
    "import { LoadingState, EmptyState } from '../../components/ui/States';",
    "import { LoadingState, EmptyState } from '../../components/ui/States';\nimport { Pagination } from '../../components/ui/Pagination';"
  );
}

// 2. Add state
if (!content.includes("const [empPage, setEmpPage]")) {
  content = content.replace(
    "const [createModalOpen, setCreateModalOpen] = useState(false);",
    `const [createModalOpen, setCreateModalOpen] = useState(false);
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);`
  );
}

// 3. Map paginated employees in list view
content = content.replace(
  "{finalEmployeesList.map((emp, idx) => {",
  `{finalEmployeesList.slice((empPage - 1) * empPageSize, empPage * empPageSize).map((emp, idx) => {`
);

// 4. Replace hardcoded list footer with <Pagination />
const oldFooterStart = "          {/* Table Pagination Footer */}";
const oldFooterEnd = "          </div>\n        </Card>";
const footerRegex = new RegExp(oldFooterStart.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "[\\s\\S]*?" + oldFooterEnd.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

content = content.replace(
  footerRegex,
  `          <Pagination
            currentPage={empPage}
            totalRecords={finalEmployeesList.length}
            pageSize={empPageSize}
            onPageChange={(p) => setEmpPage(p)}
            onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }}
          />
        </Card>`
);

// 5. Map paginated employees in kanban view
content = content.replace(
  "        /* Kanban Cards Grid matching reference UI */\n        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5\">\n          {finalEmployeesList.map((emp, idx) => {",
  `        /* Kanban Cards Grid matching reference UI */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {finalEmployeesList.slice((empPage - 1) * empPageSize, empPage * empPageSize).map((emp, idx) => {`
);

// Close kanban wrapper and add Pagination
content = content.replace(
  "            );\n          })}\n        </div>\n      )}",
  `            );
          })}
          </div>
          <Pagination
            currentPage={empPage}
            totalRecords={finalEmployeesList.length}
            pageSize={empPageSize}
            onPageChange={(p) => setEmpPage(p)}
            onPageSizeChange={(s) => { setEmpPageSize(s); setEmpPage(1); }}
          />
        </div>
      )}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated employees/index.jsx');
