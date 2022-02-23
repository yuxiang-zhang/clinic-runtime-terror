import SearchInput from "../service/search";
import * as React from "react";
import Box from "@mui/material/Box";
import {Divider, Grid,} from "@mui/material";
import Button from "@mui/material/Button";
import {useState} from "react";
import styled from '../../styles/employee.module.css';
import NewEmployeeDialog from "./newEmployeeDialog";
import {useRouter} from "next/router";
import {DataGrid} from "@mui/x-data-grid";
import {formatPhoneNumber} from "../../utils";


const EmployeeComponent = (props) => {
    const router = useRouter();
    const {employeeList, addEmployee, deleteEmployee, serviceList , displayEmployeeList , setDisplayEmployeeList} = props;
    const [addOpen, setAddOpen] = useState(false);
    const [rowSelection, setRowSelection] = useState([]);

    const handleSearch = (val) => {
        const searchValue = val.toLowerCase().trim()
        if (searchValue.length > 0) {
            const empList = employeeList.filter(
                (emp) =>
                    emp.first_name.toLowerCase().includes(searchValue) ||
                    emp.last_name.toLowerCase().includes(searchValue)
            );
            setDisplayEmployeeList(empList);
        } else {
            setDisplayEmployeeList(employeeList);
        }
    };
    const getStartDate = (params)=> {
        return  Intl.DateTimeFormat('sv-SE').format(new Date(params.row.start_date));
    }
    const getFullName = (params) => {
        return `${params.row.first_name || ''} ${params.row.last_name || ''}`;
    }
    const getPhoneNumber = (params) =>{
        return formatPhoneNumber(params.row.phone)
    }
    const columns = [
        {field: 'id', headerName: 'ID', width: 250, sortable: false},
        {field: 'first_name', headerName: 'Full name', width: 250, sortable: false, valueGetter: getFullName},
        {field: 'start_date', headerName: 'Start Date', width: 250, sortable: false , valueGetter: getStartDate},
        {field: 'phone', headerName: 'Phone', width: 300, sortable: false , valueGetter: getPhoneNumber},

    ];
    const handleDeleteEmployee = () => {
        deleteEmployee(rowSelection);
    }

    return (

        <Box>
            <SearchInput handleSearch={handleSearch}/>

            <Grid
                container
                direction="row"
                justifyContent="flex-start"
                alignItems="center"
            >
                <Grid item xs={6}>
                    <h1>Employee List
                    </h1>
                </Grid>
                <Grid item xs={3}>
                    <Button className={styled.addButton} variant="outlined" onClick={() => setAddOpen(true)}>
                        New Employee
                    </Button>
                </Grid>
                <Grid item xs={3}>
                    <Button className={styled.addButton} disabled={(rowSelection.length <= 0)} variant="outlined"
                            onClick={handleDeleteEmployee}>
                        Delete Employee
                    </Button>
                </Grid>


            </Grid>
            <Divider/>
            <DataGrid
                style={{minHeight: '60%', height: '560px'}}
                rows={displayEmployeeList}
                columns={columns}
                pagination
                pageSize={8}
                onRowClick={({row}) =>
                    router.push({
                        pathname: '/employee/details',
                        query: {empid: row.id}
                    }, '/employee')
                }
                rowsPerPageOptions={[8]}
                checkboxSelection
                hideFooterSelectedRowCount
                disableColumnMenu
                selectionModel={rowSelection}
                onSelectionModelChange={(rows) => setRowSelection(rows)}
            />

            <NewEmployeeDialog open={addOpen} setAddOpen={setAddOpen} addEmployee={addEmployee}
                               serviceList={serviceList}/>

        </Box>
    );
}
export default EmployeeComponent;