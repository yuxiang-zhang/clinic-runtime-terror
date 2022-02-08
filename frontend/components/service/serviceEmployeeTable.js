import {Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,} from '@mui/material';
import Paper from '@mui/material/Paper';

const ServiceEmployeeTable = (props) => {
    const {displayEmployeeList, handleEmployeeCheck, employeeCheckList} = props;

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 650}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell align="center">
                            <h2>First name</h2>
                        </TableCell>
                        <TableCell align="center">
                            <h2>Last name</h2>
                        </TableCell>
                        <TableCell align="center">
                            <h2>Primary</h2>
                        </TableCell>
                        <TableCell align="center"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayEmployeeList.map((employee) => (
                        <TableRow
                            key={employee.id}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell align="center">{employee.first_name}</TableCell>
                            <TableCell align="center">{employee.last_name}</TableCell>
                            <TableCell align="center">{employee.title}</TableCell>
                            <TableCell align="center">
                                <Checkbox
                                    key={employee.id}
                                    // aria-label={ename}
                                    value={employee}
                                    checked={employeeCheckList.includes(employee)}
                                    onChange={(event) => {
                                        handleEmployeeCheck(event.target.checked, employee);
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
export default ServiceEmployeeTable;
